package org.bbop.termgenie.solr;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.List;

import org.bbop.termgenie.core.Ontology;
import org.bbop.termgenie.core.Ontology.AbstractOntologyTerm.DefaultOntologyTerm;
import org.bbop.termgenie.core.Ontology.IRelation;
import org.bbop.termgenie.core.Ontology.OntologyTerm;
import org.bbop.termgenie.core.OntologyTermSuggestor;
import org.bbop.termgenie.core.eventbus.OntologyChangeEvent;
import org.bbop.termgenie.core.rules.ReasonerFactory;
import org.bbop.termgenie.index.LuceneMemoryOntologyIndex;
import org.bbop.termgenie.index.LuceneMemoryOntologyIndex.BranchDetails;
import org.bbop.termgenie.index.LuceneMemoryOntologyIndex.SearchResult;
import org.bbop.termgenie.ontology.OntologyTaskManager;
import org.bbop.termgenie.ontology.OntologyTaskManager.OntologyTask;
import org.bushe.swing.event.EventBus;
import org.bushe.swing.event.EventSubscriber;
import org.semanticweb.owlapi.model.OWLObject;

import owltools.graph.OWLGraphWrapper;
import owltools.graph.OWLGraphWrapper.Synonym;

public class BasicLuceneClient implements
		OntologyTermSuggestor,
		EventSubscriber<OntologyChangeEvent>
{

	private final String name;
	private final List<String> roots;
	private final String dlQuery;
	private final List<BranchDetails> branches;
	private final ReasonerFactory factory;

	private LuceneMemoryOntologyIndex index;
	private OWLGraphWrapper ontology;

	/**
	 * Create a new instance of an {@link OntologyTermSuggestor} using a lucene
	 * memory index.
	 * 
	 * @param ontologyManager
	 * @param factory
	 * @return new Instance of {@link BasicLuceneClient}
	 */
	public static BasicLuceneClient create(OntologyTaskManager ontologyManager, ReasonerFactory factory) {
		Ontology ontology = ontologyManager.getOntology();
		List<String> roots = ontology.getRoots();
		List<BranchDetails> branches = Collections.emptyList();
		String branchName = ontology.getBranch();
		String dlQuery = ontology.getDLQuery();
		if (branchName != null && (roots != null || dlQuery != null)) {
			BranchDetails detail = new BranchDetails(branchName, roots, dlQuery);
			branches = Collections.singletonList(detail);
			roots = null;
		}
		String name = ontology.getUniqueName();
		return create(ontologyManager, name, roots, dlQuery, branches, factory);
	}

	/**
	 * @param ontologies
	 * @param manager
	 * @param factory
	 * @return new Instance of {@link BasicLuceneClient}
	 */
	public static BasicLuceneClient create(List<Ontology> ontologies,
			OntologyTaskManager manager,
			ReasonerFactory factory)
	{
		if (ontologies == null || ontologies.isEmpty()) {
			throw new RuntimeException("At least one ontology is required to create an index.");
		}
		if (ontologies.size() == 1) {
			return create(manager, factory);
		}
		List<String> roots = null;
		String name = null;
		List<BranchDetails> branches = new ArrayList<BranchDetails>();
		String dlQuery = null;
		for (Ontology ontology : ontologies) {
			if (name == null) {
				name = ontology.getUniqueName();
				dlQuery = ontology.getDLQuery();
			}
			else {
				String cname = ontology.getUniqueName();
				if (!name.equals(cname)) {
					throw new RuntimeException("Error: Expected only one ontology group, but was: " + name + " and " + cname);
				}
			}
			String branchName = ontology.getBranch();
			List<String> cRoots = ontology.getRoots();
			String branchDLQuery = ontology.getDLQuery();
			if (branchName == null) {
				roots = cRoots;
				dlQuery = branchDLQuery;
			}
			else if (cRoots != null || branchDLQuery != null) {
				BranchDetails detail = new BranchDetails(branchName, cRoots, branchDLQuery);
				branches.add(detail);
			}
		}
		return create(manager, name, roots, dlQuery, branches, factory);
	}

	private static BasicLuceneClient create(OntologyTaskManager ontology,
			String name,
			List<String> roots,
			String dlQuery,
			List<BranchDetails> branches,
			ReasonerFactory factory)
	{
		BasicLuceneClient client = new BasicLuceneClient(name, roots, dlQuery, branches, factory);
		LuceneClientSetupTask task = new LuceneClientSetupTask(client);
		ontology.runManagedTask(task);
		return task.client;
	}

	static class LuceneClientSetupTask implements OntologyTask {

		BasicLuceneClient client = null;

		/**
		 * @param client
		 */
		LuceneClientSetupTask(BasicLuceneClient client) {
			super();
			this.client = client;
		}

		@Override
		public Modified run(OWLGraphWrapper managed) {
			client.setup(managed);
			return Modified.no;
		}

	}

	/**
	 * @param name
	 * @param roots
	 * @param dlQuery
	 * @param branches
	 */
	protected BasicLuceneClient(String name,
			List<String> roots,
			String dlQuery,
			List<BranchDetails> branches,
			ReasonerFactory factory)
	{
		super();
		this.name = name;
		this.roots = roots;
		this.dlQuery = dlQuery;
		this.branches = branches;
		this.factory = factory;
		EventBus.subscribe(OntologyChangeEvent.class, this);
	}

	void setup(OWLGraphWrapper ontology) {
		this.ontology = ontology;
		LuceneMemoryOntologyIndex old = index;
		try {
			index = new LuceneMemoryOntologyIndex(ontology, roots, dlQuery, branches, factory);
			if (old != null) {
				old.close();
			}
		} catch (IOException exception) {
			throw new RuntimeException(exception);
		}
	}

	@Override
	public void onEvent(OntologyChangeEvent event) {
		// ignore event, if it's just a reset
		if (!event.isReset()) {
			// check if the changed ontology is the one used for this index
			if (this.name.equals(event.getOntology().getUniqueName())) {
				LuceneClientSetupTask task = new LuceneClientSetupTask(this);
				event.getManager().runManagedTask(task);
			}
		}
	}

	@Override
	public List<OntologyTerm<Synonym, IRelation>> suggestTerms(String query, Ontology ontology, int maxCount) {
		if (this.name.equals(ontology.getUniqueName())) {
			Collection<SearchResult> searchResults = index.search(query,
					maxCount,
					ontology.getBranch());
			if (searchResults != null && !searchResults.isEmpty()) {
				List<OntologyTerm<Synonym, IRelation>> suggestions = new ArrayList<OntologyTerm<Synonym, IRelation>>(searchResults.size());
				for (SearchResult searchResult : searchResults) {
					suggestions.add(createTerm(searchResult.hit));
				}
				return suggestions;
			}
		}
		return null;
	}

	private OntologyTerm<Synonym, IRelation> createTerm(OWLObject hit) {
		final String identifier = ontology.getIdentifier(hit);
		final String label = ontology.getLabel(hit);
		final String def = ontology.getDef(hit);
		List<Synonym> synonyms = ontology.getOBOSynonyms(hit);
		OntologyTerm<Synonym, IRelation> term = new DefaultOntologyTerm(identifier, label, def, synonyms, null, Collections.<String, String> emptyMap(), null);
		return term;
	}

}