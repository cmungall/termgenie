package org.bbop.termgenie.servlets;

import org.bbop.termgenie.core.ioc.IOCModule;
import org.bbop.termgenie.ontology.impl.XMLReloadingOntologyModule;
import org.bbop.termgenie.rules.XMLDynamicRulesModule;
import org.bbop.termgenie.services.permissions.UserPermissionsModule;

public class TermGenieWebAppCLContextListener extends AbstractTermGenieContextListener {

	public TermGenieWebAppCLContextListener() {
		super("TermGenieWebAppCLConfigFile");
	}
	@Override
	protected IOCModule getUserPermissionModule() {
		return new UserPermissionsModule("termgenie-cl", applicationProperties);
	}
	
	@Override
	protected IOCModule getOntologyModule() {
		return new XMLReloadingOntologyModule("ontology-configuration_cl.xml", null, applicationProperties);
	}

	@Override
	protected IOCModule getRulesModule() {
		boolean assertInferences = false;
		boolean useIsInferred = false;
		return new XMLDynamicRulesModule("termgenie_rules_cl.xml", useIsInferred, assertInferences, applicationProperties);
	}

}
