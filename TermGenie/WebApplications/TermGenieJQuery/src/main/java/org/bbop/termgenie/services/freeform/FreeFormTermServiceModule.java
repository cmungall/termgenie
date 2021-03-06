package org.bbop.termgenie.services.freeform;

import java.util.List;
import java.util.Properties;

import org.bbop.termgenie.freeform.FreeFormTermValidatorModule;

public class FreeFormTermServiceModule extends FreeFormTermValidatorModule {
	
	private final String defaultOntology;
	private boolean doAsciiCheck = false;

	public FreeFormTermServiceModule(Properties applicationProperties,
			boolean addSubsetTag,
			String defaultOntology,
			List<String> oboNamespaces,
			String subset,
			List<String> additionalRelations)
	{
		super(applicationProperties, addSubsetTag, oboNamespaces, subset, additionalRelations);
		this.defaultOntology = defaultOntology;
	}
	
	/**
	 * @param doAsciiCheck the doAsciiCheck to set
	 */
	public void setDoAsciiCheck(boolean doAsciiCheck) {
		this.doAsciiCheck = doAsciiCheck;
	}

	@Override
	protected void configure() {
		super.configure();
		bind(FreeFormTermService.class, FreeFormTermServiceImpl.class);
		bind("FreeFormAutocompleteDefaultSubset", defaultOntology);
		bind("FreeFormDoAsciiCheck", doAsciiCheck);
	}

}
