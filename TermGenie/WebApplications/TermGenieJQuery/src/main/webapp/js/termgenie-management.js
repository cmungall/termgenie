/**
 * Setup term review page.
 * 
 * @returns empty object
 */
function TermGenieManagement(){
	
	// main elements from the static html page
	var mainMessagePanel = jQuery('#MainMessagePanel');
	var mainConfigurationPanel = jQuery('#MainConfigurationPanel');
	var defaultErrorMessage = mainMessagePanel.children().first();
	
	//create proxy for json rpc
	var jsonService = new JsonRpc.ServiceProxy("jsonrpc", {
	    asynchronous: true,
	    methods: ['user.createSession',
	              'user.logout',
	              'user.isAuthenticated',
	              'user.keepSessionAlive',
	              'user.getValue',
	              'user.setValue',
	              'user.getValues',
	              'user.setValues',
	              'openid.authRequest',
	              'browserid.verifyAssertion',
	              'management.isAuthorized',
	              'management.getModuleDetails',
	              'management.getSystemDetails']
	});
	// asynchronous
	JsonRpc.setAsynchronous(jsonService, true);
	
	// add link to error console
	jQuery('#termgenie-error-console-link').click(function(){
		jQuery.openLogPanel();
	});
	
	// Sessions
	var mySession = jQuery.TermGenieSessionManager(jsonService);
	
	// global elements for this site
	var myLoginPanel = jQuery.LoginPanel(jsonService, mySession, onLogin, onLogout);
	
	function onLogin() {
		mainMessagePanel.empty();
		checkUserPermissions(function(hasPermission){ // on success
			if (hasPermission === true) {
				startManagementEntries();
			}
			else {
				setInsufficientUserRightsMessage(myLoginPanel.getCredentials());
			}
		}, function(e) { // on error
			jQuery.logSystemError('Could not check user permissions on server',e);
			return true;
		});
	}
	
	function onLogout() {
		mainMessagePanel.empty();
		mainConfigurationPanel.empty();
		mainMessagePanel.append(defaultErrorMessage);
	}
	
	function setInsufficientUserRightsMessage(username) {
		mainMessagePanel.append('The current user ('+username+') is not allowed to use this review feature.');
	}
	
	function checkUserPermissions(onSuccess, onError) {
		// request sessionId and then check user permissions
		mySession.getSessionId(function(sessionId){
			jsonService.management.isAuthorized({
				params: [sessionId],
				onSuccess: onSuccess,
				onException: onError
			});	
		});
	}
	
	/**
	 * Start loading management data from server.
	 */
	function startManagementEntries() {
		// create tab layout
		mainConfigurationPanel.append(
				'<div id="tabs"><ul>'+
				'<li><a href="#tabs-1">System Details</a></li>'+
				'<li><a href="#tabs-2">Module Configuration</a></li></ul>'+
				'<div id="tabs-1"></div>'+
				'<div id="tabs-2"></div>'+
				'</div>');
		
		// load content
		loadSystemDetails(jQuery("#tabs-1"));
		loadModuleConfiguration(jQuery("#tabs-2"));
		
		// create tabs
		jQuery("#tabs").tabs();
	}
	
	/**
	 * Load the system information from the server 
	 * and append it to the given panel.
	 * 
	 * @param panel parent element to be manipulated.
	 */
	function loadSystemDetails(panel) {
		// add busy message
		panel.append(createBusyMessage('Retrieving system details from server.'));
		// request sessionId and then try to load commits for review
		mySession.getSessionId(function(sessionId){
			jsonService.management.getSystemDetails({
				params: [sessionId],
				onSuccess: function(details){
					// empty the current content
					panel.empty();
					if (details) {
						createSystemDetailsPanel(details, panel);
					}
				},
				onException: function(e) {
					// empty the current content
					panel.empty();
					jQuery.logSystemError('Could not retrieve system details from server',e);
					return true;
				}
			});	
		});
	}
	
	/**
	 * Render the system details in the given panel.
	 * 
	 * @param details system details
	 * @param panel target panel
	 */
	function createSystemDetailsPanel(details, panel) {
		var content = '<h2>System Details</h2>';
		content += '<h3>Memory Details</h3>';
		content += '<table>';
		content += '<tr><td>current heap</td><td>'+details.currentHeap+' MB</td></tr>';
		content += '<tr><td>max heap</td><td>'+details.maxHeap+' MB</td></tr>';
		content += '<tr><td>free heap</td><td>'+details.freeHeap+' MB</td></tr>';
		content += '</table>';
		if (details.environment) {
			content += '<h3>System Properties</h3>';
			content += '<table>';
			content += '<tr><td class="termgenie-module-table-header">Name</td><td class="termgenie-module-table-header">Value</td></tr>';
			
			var names = [];
			jQuery.each(details.environment, function(name){
				names.push(name);
			});
			names.sort();
			
			jQuery.each(names, function(index, name){
				var value = details.environment[name];
				content += '<tr><td>'+name+'</td><td>'+value+'</td></tr>';
			});
			content += '</table>';
		}
		panel.append(content);
	}
	
	/**
	 * Load the module information from the server 
	 * and append it to the given panel.
	 * 
	 * @param panel parent element to be manipulated.
	 */
	function loadModuleConfiguration(panel) {
		// add busy message
		panel.append(createBusyMessage('Retrieving module data from server.'));
		// request sessionId and then try to load commits for review
		mySession.getSessionId(function(sessionId){
			jsonService.management.getModuleDetails({
				params: [sessionId],
				onSuccess: function(entries){
					// empty the current content
					panel.empty();
					if (entries && entries.length > 0 && jQuery.isArray(entries)) {
						createModuleDetailsPanel(entries, panel);
					}
				},
				onException: function(e) {
					// empty the current content
					panel.empty();
					jQuery.logSystemError('Could not retrieve module data from server',e);
					return true;
				}
			});	
		});
	}
	
	/**
	 * Create a styled busy message div with and additional text for details. 
	 * 
	 * @param additionalText
	 * @returns String
	 */
	function createBusyMessage(additionalText) {
		return '<div class="termgenie-busy-message">'+
			'<img src="icon/wait26trans.gif" alt="Busy Icon"/>'+
			'<span class="termgenie-busy-message-text">Please wait.</span>'+
			'<div class="termgenie-busy-additional-text">'+additionalText+'</div><div>';
	}
	
	/**
	 * Render the module details.
	 * 
	 * @param details module info
	 * @param panel target panel
	 */
	function createModuleDetailsPanel(details, panel) {
		var topModuleHeader = jQuery('<div class="termgenie-module-header"><span class="termgenie-top-module-header-title">Module Configuration</span></div>');
		panel.append(topModuleHeader);
		var topModuleHeaderTools = jQuery('<span class="termgenie-module-header-tool"></span>');
		topModuleHeader.append(topModuleHeaderTools);
		var topModuleHeaderToolShowAll = jQuery('<span class="myClickable">Show all</span>');
		var topModuleHeaderToolHideAll = jQuery('<span class="myClickable">Hide all</span>');
		topModuleHeaderTools.append('(');
		topModuleHeaderTools.append(topModuleHeaderToolShowAll);
		topModuleHeaderTools.append(', ');
		topModuleHeaderTools.append(topModuleHeaderToolHideAll);
		topModuleHeaderTools.append(')');
		
		var moduleTables = [];
		topModuleHeaderToolShowAll.click(function(){
			jQuery.each(moduleTables, function(index, elem){
				elem.show();
			});
		});
		topModuleHeaderToolHideAll.click(function(){
			jQuery.each(moduleTables, function(index, elem){
				elem.hide();
			});
		});
		
		jQuery.each(details, function(index, module){
			var moduleHeader = jQuery('<div class="termgenie-module-header"><span class="termgenie-module-header-title">'+module.moduleName+'<span></div>');
			var moduleHeaderTools = jQuery('<span class="termgenie-module-header-tool myClickable">(Show/Hide)</span>');
			moduleHeader.append(moduleHeaderTools);
			panel.append(moduleHeader);
			var content = '<table>';
			if(module.parameters) {
				content += '<tr><td class="termgenie-module-table-header">Name</td><td class="termgenie-module-table-header">Value</td></tr>';
				jQuery.each(module.parameters, function(parameterName, parameterValue){
					content += '<tr><td>'+parameterName+'</td><td>'+parameterValue+'</td></tr>';
				});
			}
			if(module.implementations) {
				content += '<tr><td class="termgenie-module-table-header">Interface</td><td class="termgenie-module-table-header">Implementation</td></tr>';
				jQuery.each(module.implementations, function(implementationName, implementationValue){
					content += '<tr><td>'+implementationName+'</td><td>'+implementationValue+'</td></tr>';
				});
			}
			if(module.provides) {
				content += '<tr><td colspan="2" class="termgenie-module-table-header">Provides Implementations</td></tr>';
				jQuery.each(module.provides, function(providesIndex, providesValue){
					content += '<tr><td>'+providesValue.one+'</td>';
					if (providesValue.two) {
						content += '<td>'+providesValue.two+'</td>';
					}
					content += '</tr>';
				});
			}
			content += '</table>';
			var moduleTable = jQuery(content);
			panel.append(moduleTable);
			moduleTables.push(moduleTable);
			if (module.additionalData) {
				var additionalTable = jQuery('<table></table>');
				additionalTable.css('margin-top', '10pt');
				additionalTable.append('<td colspan="2" class="termgenie-module-table-header">Additional Data</td>');
				jQuery.each(module.additionalData, function(additionalDataIndex, additionalDataPair){
					var additionalRow = jQuery('<tr></tr>');
					additionalRow.append('<td>'+additionalDataPair.one+'</td>');
					var additionalCell = jQuery('<td class="termgenie-module-table-special-cell"></td>');
					var additionalPre = jQuery('<pre></pre>');
					additionalCell.append(additionalPre);
					additionalPre.text(additionalDataPair.two);
					additionalRow.append(additionalCell);
					additionalTable.append(additionalRow);
				});
				panel.append(additionalTable);
				moduleTables.push(additionalTable);
				moduleHeaderTools.click(function(){
					moduleTable.toggle();
					additionalTable.toggle();
				});
			}
			else {
				moduleHeaderTools.click(function(){
					moduleTable.toggle();
				});
			}
		});
	}
	
	return {
		// empty object to hide internal functionality
	};
}
// actual call in jQuery to execute the TermGenie management scripts
// after the document is ready
jQuery(document).ready(function(){
	// start term genie.
	TermGenieManagement();
});
