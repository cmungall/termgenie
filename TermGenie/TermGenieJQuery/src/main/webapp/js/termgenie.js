function termgenie(){
	/**
	 * Provide an Accordion with the additional functionality to 
	 * enable/disable individual panes for click events.
	 * 
	 * @param id html-id for the accordian div tag
	 */
	function MyAccordion(id) {
		// private variables;
		var selections = {};
		selections.Pane_0 = true;
		selections.Pane_1 = false;
		selections.Pane_2 = false;
		selections.Pane_3 = false;
		
		$(id).accordion({ clearStyle: true, autoHeight: false, event: "" });
		
		// implement a custom click function
		// allow only to open panes, which are enabled in the selections object
		$(id+' h3').click(function() {
			var idx = $(id+' h3').index(this);
			var activate = selections["Pane_" + idx];
			if (activate) {
				$(id).accordion("activate", idx);
			}
		});
		
		return {
			/**
			 * Active the specified panel.
			 * 
			 * @param pos postion to activate (zero-based)
			 */
			activatePane : function(pos) {
				$(id).accordion("activate", pos);
			},
			
			/**
			 * Set the status of a pane.
			 * 
			 * @param pos postion to activate (zero-based)
			 * @param state boolean
			 */
			setPaneState : function(pos, state) {
				selections["Pane_" + pos] = state;
			},
		
			/**
			 * Enable a pane for click events.
			 * 
			 * @param pos postion to enable (zero-based)
			 */
			enablePane : function(pos) {
				selections["Pane_" + pos] = true;
			},
			
			/**
			 * Disable a pane for click events.
			 * 
			 * @param pos postion to disable (zero-based)
			 */
			disablePane : function(pos) {
				selections["Pane_" + pos] = false;
			}
		};
	};
	
	function LoginPanel() {
		
		var panel = createLoginPanel();
		
		
		return {
			isLoggedIn: function() {
				return false;
			},
			getCredentials: function() {
				return {
					username : '',
					password : ''
				}
			}
		};
		
		function createLoginPanel() {
			var elem = $('<div style="width: 200px"></div>');
			elem.appendTo('body');
			elem.css({
				display:'block',
				position:'absolute',
				top:10,
				right:10,
				width:'200px',
				background:'#eee',
				border:'1px solid #ddd'
			});
			var loginClickElem = $('<span class="myClickable">Log in</span>');
			elem.append(loginClickElem);
			
			var logoutClickElem = $('<span class="myClickable">Log out</span>');
			
			var loginPanel = $('<div>'+
					'<div style="padding-bottom:5px">To commit terms a login is required.</div>'+
					'<table><tr><td>Username:</td>'+
					'<td><input type="text" id="input-user-name"/></td></tr>'+
					'<tr><td>Password:</td>'+
					'<td><input type="password" id="input-user-password"/></td></tr>'+
					'</table>'+
					'</div>');
			loginPanel.appendTo('body');
			
			var loginBusyPanel = $('<div></div>');
			loginBusyPanel.appendTo(loginPanel);
			
			loginPanel.dialog({
				title: 'Login for TermGenie',
				autoOpen: false,
				height: 250,
				width: 350,
				modal: true,
				buttons: {
					"Log In": function() {
						// TODO execute login
						// on success replace with username and logout button
//						elem.detach();
					},
					"Cancel": function() {
						$( this ).dialog( "close" );
					}
				}
			});
			
			loginClickElem.click(function(){
				loginPanel.dialog('open');
			});
			
			return elem;
		}
	}
	
	var myAccordion = MyAccordion('#accordion');
	var myLoginPanel = LoginPanel(); 
	var myUserPanel = createUserPanel();
	
	//create proxy for json rpc
	var jsonService = new JsonRpc.ServiceProxy("jsonrpc", {
	    asynchronous: true,
	    methods: ['generate.availableTermTemplates', 
	              'generate.generateTerms', 
	              'ontology.availableOntologies', 
	              'commit.isValidUser',
	              'commit.exportTerms',
	              'commit.commitTerms']
	});
	// asynchronous
	JsonRpc.setAsynchronous(jsonService, true);

	
	// create buy icon and message to show during wait
	$('#div-select-ontology').append(createBusyMessage('Quering for available ontologies at the server.'));
	
	// use json-rpc to retrieve available ontologies
	jsonService.ontology.availableOntologies({
		onSuccess: function(result) {
			/*
			 * Actual start code for the page.
			 * 
			 * Retrieve and create the content for the step 1. 
			 */
			createOntologySelector(result);
		},
		onException: function(e) {
			$('#div-select-ontology').empty();
			loggingSystem.logSystemError('AvailableOntologies service call failed',e)
			return true;
		}
	});
	
	/**
	 * Create a selector for the given list of ontologies.
	 * 
	 * Side conditions: 
	 *   - assumes the list to be non-empty, 
	 *   - if ontologies.length === 1, skip selection menu and go to next step 
	 * 
	 * @param ontologies list of ontology names
	 */
	function createOntologySelector(ontologies) {
		var selectedValue;
		var ontselect;
		var elem;
		// create selector for given ontologies
		if (ontologies.length === 1) {
			// short cut, if only one exists, skip this step
			selectedValue = ontologies[0];
			setStep1Header(selectedValue);
			createTemplateSelector(selectedValue);
			// go to the next panel and deactivate the first panel
			setStep2Active(false);
		} else {
			ontselect = c_span('select-ontology-header','Available Ontologies') +
			'<select id="select-ontology-select">';
			$.each(ontologies, function(intIndex, objValue){
				ontselect += '<option value="'+objValue+'">'+objValue+'</option>';
			});
			ontselect += '</select>'+ c_button('select-ontology-button', 'Submit');
			
			// add to div
			elem = $('#div-select-ontology');
			elem.empty();
			elem.append(ontselect);
			
			// register click handler
			$('#select-ontology-button').click(function() {
				var selectedValue = $('#select-ontology-select').val();
				setStep1Header(selectedValue);
				createTemplateSelector(selectedValue);
				setStep2Active(true);
			});
		}
		
		/**
		 * Set the selected ontology name in the header.
		 * 
		 * @param ontology selected ontology name
		 */
		function setStep1Header(ontology) {
			var elem = $('#span-step1-additional-header');
			elem.empty();
			elem.append('<span class="step1-additional-header">'+ontology+'</span>');
		}
		
		/**
		 * Active the second step. Depending on the parameter, the pane 
		 * for step 1 can be revisited.
		 * 
		 * @param step1Available boolean
		 */
		function setStep2Active(step1Available) {
			myAccordion.setPaneState(0, step1Available);
			myAccordion.enablePane(1);
			myAccordion.activatePane(1);
		}
	}
	
	/**
	 * Variable for keeping the template widgets 
	 */
	var termTemplateWidgetList = null;
	
	/**
	 * Create the menu for selecting term generation templates. 
	 * 
	 * @param ontology selected ontology name
	 */
	function createTemplateSelector(ontology) {
		// create general layout
		var termselect = c_div('div-template-selector', 
				c_span('select-template-header','Select Template'))+
				c_div('div-all-template-parameters','');
		
		// get intented dom element
		var elem = $('#div-select-templates-and-parameters');
		// clear, from previous templates
		elem.empty();
		
		// clear header from previous templates
		$('#span-step2-additional-header').empty();
		
		// set busy message
		elem.append(createBusyMessage('Quering for available termplates at the server.'));
		
		// start async rpc to retrieve available templates
		jsonService.generate.availableTermTemplates({
			params:[ontology],
			onSuccess: function(result) {
				// clear from busy message
				elem.empty();
				// append layout
				elem.append(termselect);
				
				termTemplateWidgetList = TermTemplateWidgetList(result);
				createTemplateSelectorMenu(ontology, result);
				registerTermGenerationButton();
			},
			onException: function(e) {
				elem.empty();
				loggingSystem.logSystemError('AvailableTermTemplates service call failed',e);
				return true;
			}
		});
		
		function registerTermGenerationButton() {
			// register click handler for term generation button
			var submitButton = $('#button-termgeneration-start');
			var busyElement= $('#button-termgeneration-start-progress');
			submitButton.click(function(){
				busyElement.empty();
				var status = termTemplateWidgetList.getAllTemplateParameters();
				if (status.success !== true) {
					loggingSystem.logUserMessage('Verification failed, please check marked fields.');
					return;
				}
				if (status.parameters.length === 0) {
					loggingSystem.logUserMessage('Please select a template from the menu, and click on add template. '+
						'Provide details for the required fields and click on the "'+
						submitButton.text()+
						'"-Button again, to proceed to the next step.');
					return;
				}
				busyElement.append(createBusyMessage('Verifing your request and generating terms on the server.'));
				setStep2HeaderInfo(status.parameters);
				jsonService.generate.generateTerms({
					params:[ontology, status.parameters],
					onSuccess: function(result) {
						busyElement.empty();
						renderStep3(result, ontology);
					},
					onException: function(e) {
						busyElement.empty();
						loggingSystem.logSystemError("GenerateTerms service call failed", e);
						return true;
					}
				});
			});
		}
		
		function setStep2HeaderInfo(parameters) {
			var header = $('#span-step2-additional-header');
			header.empty();
			var map = {};
			for ( var i = 0; i < parameters.length; i++) {
				var name = parameters[i].termTemplate.name;
				if(!map[name]) {
					map[name] = 1;
				}
				else{
					map[name] = 1 + map[name];
				}
			}
			var headerInfo = '';
			$.each(map, function(key, value) {
				if (headerInfo.length > 0) {
					headerInfo += ', ';
				}
				headerInfo += key + ' (' + value + ')';
			});
			header.append(headerInfo);
		}
		
		function renderStep3(generationResponse, ontology) {
			createResultReviewPanel(generationResponse, ontology);
			myAccordion.enablePane(2);
			myAccordion.activatePane(2);	
		}
	}
	
	/**
	 * Create the selection menu for the list of templates
	 * 
	 * @param ontology ontology name
	 * @param templates list of term templates
	 */
	function createTemplateSelectorMenu(ontology, templates) {
		// create layout
		$('#div-template-selector')
			.append('<select id="select-add-template-select"></select>'+
				c_button('button-add-template-select', 'Add template'));
		
		// select dom element
		var domElement = $('#select-add-template-select');

		// foreach template create a menu entry, use index for retrieval
		$.each(templates, function(intIndex, objValue) {
			var templateName = objValue.name;
			var option = $('<option />');
			option.text(templateName);
			option.val(intIndex);
			domElement.append(option);
		});
		
		// click handler for adding a selected template
		$('#button-add-template-select').click(function (){
			var intIndex = $('#select-add-template-select').val();
			termTemplateWidgetList.addTemplate(templates[intIndex]);
		});
	}
	
	/**
	 * Holder of all template widgets. Provides methods for adding 
	 * and removing of widgets.
	 * 
	 * @param templates list of all templates for this widget
	 */
	function TermTemplateWidgetList(templates){
		// private members
		var templateMap = {};
		
		// private methods
		function createTemplateSubList(template, id, wrapperId) {
			var templateContainer = $('<div id="'+wrapperId+'" class="template-list-wrapper"></div>');
			templateContainer.appendTo($('#div-all-template-parameters'));
			var templateTitle = $('<div class="termgenie-template-header">Template: <span class="label-template-name">'+template.name+'</span></div>');
			createAddRemoveWidget(templateTitle, 
					function(){
						privateAddTemplate(template);
					}, 
					function(){
						privateRemoveTemplate(template);
					});
			
			templateContainer.append(templateTitle);
			templateContainer.append('<div id="'+id+'"></div>')
			
		}
		
		function privateAddTemplate(template) {
			var templateListContainer = templateMap[template.name];
			if (!templateListContainer) {
				templateListContainer = {
					count : 0,
					list : new Array(),
					id : 'div-all-template-parameters-'+template.name,
					wrapperId : 'div-all-template-parameters-wrapper-'+template.name
				}
				createTemplateSubList(template, templateListContainer.id, templateListContainer.wrapperId);
				templateMap[template.name] = templateListContainer;
			}
			var templateWidget = TermTemplateWidget(template,templateListContainer.count);
			templateListContainer.list[templateListContainer.count] = templateWidget;
			
			var listElem = $('#'+templateListContainer.id);
			
			// if the list was empty create the layout 
			if (templateListContainer.count === 0) {
				templateWidget.createLayout(listElem);
			}
			// append a new line to the list
			var domId = templateListContainer.id+'-'+templateListContainer.count;
			templateWidget.appendLine(listElem, domId);
			
			templateListContainer.count += 1;
		}
		
		function privateRemoveTemplate(template) {
			var templateListContainer = templateMap[template.name];
			if (templateListContainer) {
				if (templateListContainer.count > 1) {
					var pos = templateListContainer.count - 1;
					var domId = templateListContainer.id+'-'+pos;
					$('#'+domId).remove();
					templateListContainer.list[pos] = undefined;
					templateListContainer.count = pos;
				}
				else {
					$('#'+templateListContainer.wrapperId).remove();
					templateMap[template.name] = undefined;
				}
			}
		}
		
		return {
			//public methods
			
			/**
			 * add a template to the widget list. Group the templates by 
			 * template name. Order the list by creation of the groups, 
			 * not by name.
			 */
			addTemplate : function (template) {
				privateAddTemplate(template);
			},
			
			/**
			 * remove a template. When the last template of a group is 
			 * removed, the empty group is also removed.
			 */
			removeTemplate : function(template) {
				privateRemoveTemplate(template);
			},
			
			/**
			 * extract and validate all input fields for the requested 
			 * templates.
			 * 
			 * return object {
			 *    success: boolean
			 *    parameters: JsonTermGenerationInput{
			 *       termTemplate: JsonTermTemplate,
			 *       termGenerationParameter: JsonTermGenerationParameter
			 *    }[]
			 * }
			 */
			getAllTemplateParameters : function() {
				var success = true;
				var count = 0;
				var parameters = [];
				$.each(templateMap, function(name, listcontainer){
					if (listcontainer && listcontainer.list) {
						var list = listcontainer.list;
						$.each(list, function(index, templateWidget){
							var extracted = templateWidget.extractTermGenerationInput();
							if(extracted) {
								success = success && extracted.success;
								if (extracted.success === true) {
									parameters[count] = extracted.input;
									count += 1;
								}
							}
						});
					}
				});
				return {
					success : success,
					parameters: parameters
				}
			}
		};
	};
	
	/**
	 * Keep all the information for one template and functions to render it.
	 * 
	 * @param template termgeneration template
	 * @param id internal id number
	 */
	function TermTemplateWidget(template, id) {
		var templateFields = template.fields;
		var inputFields = [];
		
		return {
			/**
			 * get internal id, used to distinguish 
			 * between templates with the same name.
			 * 
			 * return id
			 */
			getId : function() {
				return id;
			},
			
			/**
			 * create layout for this template, including header and footer
			 * 
			 * @param elem parent dom element
			 */
			createLayout : function(elem) {
				var i; 		// define here as there is only function scope
				var field;	// define here as there is only function scope
				
				var layout = createLayoutTableOpenTag()+'<thead><tr><td>Required</td>';
				
				// write top level requirements
				var first = true;
				for (i = 1; i < templateFields.length; i+=1) {
					field = templateFields[i];
					if (first && field.required === false) {
						first = false;
						layout += '<td>Optional</td>';
					}
					else {
						layout += '<td></td>';
					}
				}
				layout += '</tr><tr>';
				
				// write field names
				for (i = 0; i < templateFields.length; i+=1) {
					field = templateFields[i];
					layout += '<td>'+field.name+'</td>';
				}
				
				// write empty body and footer
				layout += '</tr></thead><tbody></tbody></table>';
				
				elem.append(layout);
			},
			
			/**
			 * Append the term template in layout format, including all functionality.
			 * 
			 * @param elem parent dom element 
			 * @param domId the unique id for this line
			 */
			appendLine : function(elem, domId) {
				// define variable here as there is only function scope
				var i;
				var field;
				var tdElement;
				
				var trElement = $('<tr id="'+domId+'"></tr>');
				elem.find('tbody').first().append(trElement);
				
				for (i = 0; i < templateFields.length; i+=1) {
					field = templateFields[i];
					trElement.append('<td></td>');
					tdElement = trElement.children().last();
					
					if (field.ontologies && field.ontologies.length > 0) {
						var cardinality = field.cardinality;
						if (cardinality.min === 1 && cardinality.max === 1) {
							var prefixes = field.functionalPrefixes;
							if (prefixes && prefixes.length > 0) {
								inputFields[i] = AutoCompleteOntologyInputPrefix(tdElement, i, field.ontologies, prefixes);
							}
							else {
								inputFields[i] = AutoCompleteOntologyInput(tdElement, i, field.ontologies);	
							}
						}
						else {
							inputFields[i] = AutoCompleteOntologyInputList(tdElement, i, field.ontologies, cardinality.min, cardinality.max);
						}
					}
					else {
						var cardinality = field.cardinality;
						if (cardinality.min === 1 && cardinality.max === 1) {
							inputFields[i] = TextFieldInput(tdElement, i);
						}
						else {
							inputFields[i] = TextFieldInputList(tdElement, i, cardinality.min, cardinality.max);
						}
					}
				}
			},
			
			/**
			 * extract and validate all input fields for this template.
			 * 
			 * return object {
			 *    success: boolean
			 *    input: JsonTermGenerationInput{
			 *       termTemplate: JsonTermTemplate,
			 *       termGenerationParameter: JsonTermGenerationParameter
			 *    }
			 * }
			 */
			extractTermGenerationInput : function() {
				var success = true;
				var parameter = {
						terms:    [],
						strings:  [],
						prefixes: []
					};
				
				for ( var i = 0; i < templateFields.length; i++) {
					var templatefield = templateFields[i];
					var inputField =  inputFields[i];
					var csuccess = inputField.extractParameter(parameter, templatefield);
					success = success && csuccess;
				}
				return {
					success: success,
					input: {
						termTemplate: template,
						termGenerationParameter: parameter
					}
				};
			}
		};
	}
	
	
	function TextFieldInput(elem, templatePos) {
		var inputElement = $('<input type="text"/>'); 
		elem.append(inputElement);
		
		inputElement.change(function(){
			clearErrorState();
		});
		
		function clearErrorState(){
			inputElement.removeClass('termgenie-input-field-error');	
		}
		
		function setErrorState() {
			inputElement.addClass('termgenie-input-field-error');
		}
		
		return {
			extractParameter : function(parameter, field, pos) {
				clearErrorState();
				if (!pos) {
					pos = 0;
				}
				var text = elem.val();
				if (text !== null && text.length > 0) {
					var list = parameter.strings[templatePos];
					if (!list) {
						list = [];
						parameter.strings[templatePos] = list;
					}
					list[pos] = text;
					return true;
				}
				var success = (field.required === false);
				if (success === false) {
					setErrorState();
				}
				return success;
			}
		};
	}
	
	function TextFieldInputList(container, templatePos, min, max) {
		
		var count = 0;
		var list = [];
		var listParent = createLayoutTable();
		listParent.appendTo(container);
		for ( var i = 0; i < min; i++) {
			appendInput(count);
		}
		createAddRemoveWidget(container, appendInput, removeInput);
		
		function appendInput() {
			if (count <  max) {
				var listElem = $('<tr><td></td></tr>');
				listElem.appendTo(listParent);
				list[count] = TextFieldInput(listElem.children().first(), templatePos);
				count += 1;
			}
		}
		
		function removeInput() {
			if (count > min) {
				count -= 1;
				listParent.find('tr').last().remove();
				list[count] = undefined;
			}
		}
		
		return {
			extractParameter : function(parameter, field, pos) {
				var success = true;
				for ( var i = 0; i < count; i++) {
					var inputElem = list[i];
					if (inputElem) {
						var csuccess = inputElem.extractParameter(parameter, field, i);
						success = success && csuccess;
					}
				}
				return success;
			}
		};
	}
	
	// the autocomplete seems to rely on synchronus responses
	// it does not work with a function call back (so far)
	var jsonSyncService = new JsonRpc.ServiceProxy("jsonrpc", {
	    asynchronous: false,
	    methods: ['ontology.autocomplete']
	});
	// asynchronous
	JsonRpc.setAsynchronous(jsonSyncService, false);
	
	function AutoCompleteOntologyInput(elem, templatePos, ontologies) {
		
		var term = undefined;
		var inputElement = $('<input/>');
		elem.append(inputElement);
		var descriptionDiv = null;
		
		function clearErrorState() {
			inputElement.removeClass('termgenie-input-field-error');	
		}
		
		function setErrorState() {
			inputElement.addClass('termgenie-input-field-error');
		}
		
		function updateDescriptionDiv(ofElement) {
			var w = ofElement.outerWidth();
			if (w < 400) {
				w = 400;
			}
			var h = ofElement.outerHeight();
			if (h < 200) {
				h = 200;
			}
			if (descriptionDiv === null) {
				descriptionDiv = $('<div><div class="term-description-content"></div></div>')
					.addClass( 'ui-widget-content ui-autocomplete ui-corner-all' )
					.css({
						'width': w,
						'height': h
					})
					.appendTo('body');
				descriptionDiv.resizable({
					minHeight: h,
					minWidth: w
				});
				descriptionDiv.draggable();
			}
			else {
				descriptionDiv.resizable( "option", "minHeight", h );
				descriptionDiv.resizable( "option", "minWidth", w );
			}
			descriptionDiv.position({
				my: 'left top',
				at: 'right top',
				of: inputElement.autocomplete('widget'),
				collision: 'none none'
			});
		}
		
		function removeDescriptionDiv() {
			if (descriptionDiv !== null) {
				descriptionDiv.removeClass('ui-autocomplete-input');
				descriptionDiv.remove();
				descriptionDiv = null;
			}
		}
		
		function setContentDescriptionDiv(item) {
			var content = descriptionDiv.children().first();
			content.empty();
			var layout = createLayoutTableOpenTag();
			layout += '<tr><td>Ontology</td><td>'+item.identifier.ontology+'</td></tr>';
			layout += '<tr><td>Label</td><td>'+item.label+'</td></tr>';
			layout += '<tr><td>Identifier</td><td>'+item.identifier.termId+'</td></tr>';
			if (item.description && item.description.length > 0) {
				layout += '<tr><td>Description</td><td>'+item.description+'</td></tr>';
			}
			if (item.synonyms && item.synonyms.length > 0) {
				layout += '<tr><td>Synonyms</td><td>';
				for ( var i = 0; i < item.synonyms.length; i++) {
					var synonym = item.synonyms[i];
					if (synonym && synonym.length > 0) {
						if (i > 0) {
							layout += '<br/>';
						}
						layout += synonym;
					}
				}
				layout += '</td></tr>';
			}
			layout += '</table>'; 
			content.append(layout);
		}
		
		inputElement.autocomplete({
			minLength: 3,
			source: function( request, response ) {
				removeDescriptionDiv();
				var term = request.term;
				try {
					var data = jsonSyncService.ontology.autocomplete(term, ontologies, 5);
					if (data !== null || data.length > 0) {
						response(data);	
					}
				} catch (e) {
					loggingSystem.logSystemError('Autocomplete service call failed', e, true);
				}
			},
			select : function(event, ui) {
				clearErrorState();
				inputElement.val(ui.item.label);
				term = ui.item;
				removeDescriptionDiv();
				return false;
			},
			focus : function(event, ui) {
				inputElement.val(ui.item.label);
				updateDescriptionDiv(inputElement.autocomplete('widget'));
				setContentDescriptionDiv(ui.item);
				return false;
			},
			close : function(event, ui) {
				removeDescriptionDiv();
			} 
		})
		.data( 'autocomplete' )._renderItem = function( ul, item ) {
			return $( '<li class="termgenie-autocomplete-menu-item"></li>' )
				.data( 'item.autocomplete', item )
				.append( '<a><span class="termgenie-autocomplete-menu-item-label">' + 
						item.label + '</span></a>' )
				.appendTo( ul );
		};

		
		
		return {
			extractParameter : function(parameter, field, pos) {
				clearErrorState();
				if (!pos) {
					pos = 0;
				}
				if (term && term !== null) {
					var text = inputElement.val();
					if (term.label == text) {
						var identifier = term.identifier;
						var list = parameter.terms[templatePos];
						if (!list) {
							list = [];
							parameter.terms[templatePos] = list;
						}
						list[pos] = identifier;
						return true;
					}
				}
				setErrorState();
				return false;
			}
		};
	}
	
	function AutoCompleteOntologyInputList(container, templatePos, ontologies, min, max) {
		
		var count = 0;
		var list = [];
		var listParent = createLayoutTable();
		listParent.appendTo(container);
		for ( var i = 0; i < min; i++) {
			appendInput(count);
		}
		createAddRemoveWidget(container, appendInput, removeInput);
		
		function appendInput() {
			if (count <  max) {
				var listElem = $('<tr><td></td></tr>');
				listElem.appendTo(listParent);
				list[count] = AutoCompleteOntologyInput(listElem.children().first(), templatePos, ontologies);
				count += 1;
			}
		}
		
		function removeInput() {
			if (count > min) {
				count -= 1;
				listParent.find('tr').last().remove();
				list[count] = undefined;
			}
		}
		
		return {
			extractParameter : function(parameter, field, pos) {
				var success = true;
				for ( var i = 0; i < count; i++) {
					var inputElem = list[i];
					if (inputElem) {
						var csuccess = inputElem.extractParameter(parameter, field, i);
						success = success && csuccess;
					}
				}
				return success;
			}
		};
	}
	
	function AutoCompleteOntologyInputPrefix (elem, templatePos, ontologies, prefixes) {
		var checkbox, i, j;
		
		var container = createLayoutTable();
		container.appendTo(elem);
		var inputContainer = $('<tr><td></td></tr>');
		inputContainer.appendTo(container);
		
		var inputField = AutoCompleteOntologyInput(inputContainer, templatePos, ontologies);
		
		var checkboxes = [];
		for ( i = 0; i < prefixes.length; i++) {
			checkbox = $('<input type="checkbox" checked="true"/>');
			checkboxes[i] = checkbox;
			inputContainer = $('<tr><td class="prefixCheckbox"></td></tr>');
			inputContainer.append(checkbox);
			inputContainer.append('<span class="term-prefix-label"> '+prefixes[i]+' </span>');
			inputContainer.appendTo(container);
		}
		
		function clearErrorState() {
			container.removeClass('termgenie-input-field-error');	
		}
		
		function setErrorState() {
			container.addClass('termgenie-input-field-error');
		}
		
		return {
			extractParameter : function(parameter, field, pos) {
				clearErrorState();
				if (!pos) {
					pos = 0;
				}
				var success = inputField.extractParameter(parameter, field, pos);
				
				var count = 0;
				var cPrefixes = [];
				
				for ( j = 0; j < checkboxes.length; j++) {
					checkbox = checkboxes[j];
					if(checkbox.is(':checked')) {
						cPrefixes[count] = prefixes[j];
						count += 1;
					}
				}
				if (count === 0) {
					setErrorState();
					return false;
				}
				parameter.strings[templatePos] = cPrefixes;
				return success;
			}
		};
	}
	
	/**
	 * Create the dynamic part of the user panel
	 */
	function createUserPanel() {
		var checkBoxElem = $('#checkbox-try-commit');
		return {
			submit : function (terms, ontology) {
				// select mode
				var isCommit = checkBoxElem.is(':checked');
				
				var step3AdditionalHeader = $('#span-step3-additional-header');
				step3AdditionalHeader.empty();
				
				var headerMessage = 'Selected ';
				headerMessage += terms.length;
				headerMessage += '  Term';
				if (terms.length > 1) {
					headerMessage += 's';
				}
				headerMessage += ' for ';
				
				if (isCommit) {
					headerMessage += 'Commit';
				} else {
					headerMessage += 'Export';
				}
				step3AdditionalHeader.append(headerMessage);
				var step4Container = $('#termgenie-step4-content-container');
				step4Container.empty();
				myAccordion.enablePane(3);
				myAccordion.activatePane(3);
				
				if (isCommit) {
					var username = $('#input-user-name').val();
					var password = $('#input-user-password').val();
					// TODO verify username and password
					
					step4Container.append(createBusyMessage('Executing commit request on the server.'));
					// try to commit
					jsonService.commit.commitTerms({
						params: [terms, ontology, username, password],
						onSuccess: function(result) {
							step4Container.empty();
							renderCommitResult(result, step4Container);
						},
						onException: function(e) {
							step4Container.empty();
							loggingSystem.logSystemError("CommitTerms service call failed", e);
							return true;
						}
					});
				} else {
					step4Container.append(createBusyMessage('Preparing terms for export on the server.'));
					// just generate the info for the export a obo/owl
					jsonService.commit.exportTerms({
						params: [terms, ontology],
						onSuccess: function(result) {
							step4Container.empty();
							renderExportResult(result, step4Container);
						},
						onException: function(e) {
							step4Container.empty();
							loggingSystem.logSystemError("ExportTerms service call failed", error);
							return true;
						}
					});
				}
			}
		};
	}
	
	/**
	 * Display the results for the term generation.
	 * 
	 * @param ontology
	 * @param generationResponse 
	 * Type: 
	 * JsonGenerationResponse {
	 *     generalError: String,
	 *     errors: JsonValidationHint{
	 *         template: JsonTermTemplate,
	 *         field: int,
	 *         level: int,
	 *         hint: String;
	 *     }[],
	 *     generatedTerms: JsonOntologyTerm {
	 *     	   id: String,
	 *     	   label: String,
	 *     	   definition: String,
	 *     	   logDef: String,
	 *     	   comment: String,
	 *     	   defxRef: String[],
	 *     	   relations: JsonTermRelation {
	 *     			source: String,
	 *     			target: String,
	 *     			properties: String[]
	 *         }[]
	 * 	   }[]
	 */
	function createResultReviewPanel(generationResponse, ontology){
		var container = $('#div-verification-and-review');

		// clear from previous results
		container.empty();
		// hide the submiy panel, till it is clear 
		// that there are results for the next step
		$('#div-step3-submit-panel').hide();
		// remove existing click handler
		clearSubmitHandler();

		if (!generationResponse) {
			return;
		}

		if (isValid(generationResponse.generalError)) {
			renderGeneralError(container, generationResponse.generalError);			
			return;
		}

		if(isValid(generationResponse.errors)) {
			renderErrors(container, generationResponse.errors);
		}

		var checkBoxes = null;

		if(isValid(generationResponse.generatedTerms)) {
			checkBoxes = renderGeneratedTerms(parent, generationResponse.generatedTerms);

			setSubmitHandler(checkBoxes, generationResponse.generatedTerms, ontology);

			// show hidden panel
			$('#div-step3-submit-panel').show();
		}
		
		// Helper functions, to improve readability of the code
		
		function isValid(field) {
			return field && field.length > 0;
		}
		
		function renderGeneralError(parent, generalError) {
			var generalErrorContainer = $('<div class="term-generation-general-error"></div>');
			generalErrorContainer.appendTo(parent);
			generalErrorContainer.append('<div class="term-generation-general-error-heading">Error Message</div>');
			generalErrorContainer.append('<div class="term-generation-general-error-description">Your request produced the following error:</div>');
			generalErrorContainer.append('<div class="term-generation-general-error-details">'+generalError+'</div>');
			generalErrorContainer.append('<div class="term-generation-general-error-description">Please check your input and retry. If the problem persits, please contact the TermGenie team.</div>');
		}
		
		function renderErrors(parent, errors) {
			var detailedErrorContainer = $('<div class="term-generation-detailed-errors"></div>');
			detailedErrorContainer.appendTo(parent);
			detailedErrorContainer.append('<div class="term-generation-detailed-errors-heading">Error Messages</div>');
			detailedErrorContainer.append('<div class="term-generation-detailed-errors-description">Your request produced the following list of errors.</div>');
			var layout = $('<table cellpadding="5"></table>');
			detailedErrorContainer.append(layout);
			detailedErrorContainer.append('<div class="term-generation-detailed-errors-description">Please consider the messages and try to fix them, by changing the input from the previous step.</div>');
			
			layout.append('<thead><tr><td>Template</td><td>Field</td><td>Level</td><td>Message</td></tr></thead>');
			
			$.each(errors, function(index, validationHint){
				var trElement = $('<tr></tr>');
				trElement.appendTo(layout);
				trElement.append('<td>' + validationHint.template.name + '</td>');
				if(validationHint.field >= 0 && validationHint.field < validationHint.template.fields.length) {
					trElement.append('<td>' + 
						validationHint.template.fields[validationHint.field].name +
						'</td>');
				}
				else {
					trElement.append('<td></td>');
				}
				trElement.append('<td>' + renderWarningLevel(validationHint.level) + '</td>');
				trElement.append('<td>' + validationHint.hint +'</td>');
			});
			
			function renderWarningLevel(level) {
				if (level < 10) {
					return '<span class="warn-level-warn">Warning</span>';
				}
				if (level > 10) {
					return '<span class="warn-level-fatal">Fatal</span>';
				}
				return '<span class="warn-level-error">Error</span>';
			}
		}
		
		function renderGeneratedTerms(parent, generatedTerms) {
			var checkBoxCount = 0;
			var checkBoxes = [];
			var generatedTermContainer = $('<div class="term-generation-details"></div>');
			generatedTermContainer.appendTo(container);
			
			generatedTermContainer.append('<div class="term-generation-details-heading">Proposed new terms by TermGenie</div>')
			generatedTermContainer.append('<div class="term-generation-details-description">Your request produced the following list of term candidates:</div>')
			var layout = $('<table cellpadding="5" class="termgenie-proposed-terms-table"></table>');
			generatedTermContainer.append(layout);
			
			layout.append('<thead><tr><td></td><td>Label</td><td>Definition</td><td>Logical Definition</td><td>Synonyms</td><td>MetaData</td><td>Relations</td></tr></thead>');
			
			$.each(generatedTerms, function(index, term){
				
				var trElement = $('<tr></tr>');
				trElement.appendTo(layout);
				var tdElement = $('<td></td>');
				tdElement.appendTo(trElement);
				var checkBox = $('<input type="checkbox"/>');
				checkBox.appendTo(tdElement);
				checkBoxes[checkBoxCount] = checkBox;
				checkBoxCount += 1;
				
				var fieldnames = ['label','definition','logDef']; 
				$.each(fieldnames, function(index, fieldName) {
					var tdElement = $('<td></td>');
					tdElement.appendTo(trElement);
					tdElement.append(term[fieldName]);
				});
				
				var tdElement = $('<td></td>');
				tdElement.appendTo(trElement);
				if(term.synonyms && term.synonyms.length > 0) {
					var subtable = $('<ul></ul>');
					subtable.appendTo(tdElement);
					$.each(term.synonyms, function(index, value){
						subtable.append('<li>'+value+'</li>');
					});
				}
			});
			generatedTermContainer.append('<div class="term-generation-details-description">Please select the term(s) for the final step.</div>')
			
			return checkBoxes;
		}
		
		function clearSubmitHandler() {
			$('#button-submit-for-commit-or-export').unbind('click');
		}
		
		function setSubmitHandler(checkBoxes, generatedTerms, ontology) {
			/*
			 * add functionality to the submit button:
			 * only try to commit, if at least one check box is enabled,
			 * otherwise prepare for export.
			 */
			$('#button-submit-for-commit-or-export').click(function(){
				var count = 0;
				var terms = [];
				if (checkBoxes !== null) {
					$.each(checkBoxes, function(index, checkBox){
						if (checkBox.is(':checked')) {
							terms[count] = generatedTerms[index];
							count += 1;
						}
					});
				}
				if (count == 0) {
					loggingSystem.logUserMessage('Please select at least one term to proceed.');
					return;
				}
				
				myUserPanel.submit(terms, ontology);
			});
		}
	}
	
	/**
	 * @param commitResults JsonCommitResult {
	 * 		success: boolean,
	 * 		message: String,
	 * 		terms: JsonOntologyTerm[]
	 * 
	 * }
	 * @param container target DOM element
	 */
	function renderCommitResult(commitResults, container) {
		container.append('<div class="term-generation-commit-heading">Commit<div>');
		if (commitResults.success === true) {
			// TODO
		}
		else {
			container.append('<div>The commit of the generated terms did not complete normally with the following reason:</div>');
			container.append('<div class="term-generation-commit-error-details">'+commitResults.message+'</div>');
		}
	}
	
	/**
	 * @param exportResult JsonExportResult {
	 * 		success: boolean,
	 * 		message: String,
	 * 		formats: String[],
	 * 		contents: String[]
	 * }
	 * @param container target DOM element
	 */
	function renderExportResult(exportResult, container) {
		var i;
		var name;
		var content;
		container.append('<div class="term-generation-export-heading">Export<div>');
		var exportsContainer = $('<div class="term-generation-exports"></div>');
		exportsContainer.appendTo(container);
		if (exportResult.success === true) {
			for( i = 0; i < formats.length; i += 1) {
				name = exportResult.formats[i];
				if (name && name.length > 0 && exportResult.contents.length > i) {
					content = exportResult.contents[i];
					if (content && content.length > 0) {
						renderExport(name, content, exportsContainer);
					}
				}
			}
		}
		else {
			container.append('<div>The export of the generated terms did not complete normally with the following reason:</div>');
			container.append('<div class="term-generation-export-error-details">'+exportResult.message+'</div>');
		}
		
		
		function renderExport(name, content, exportsContainer) {
			exportsContainer.append('<div>'+name+'</div>');
			exportsContainer.append('<pre>'+content+'</pre>');
		}
	}
	
	// Logging and user messages
	var loggingSystem = LoggingSystem ();
	
	function LoggingSystem () {
		
		var popupLoggingPanel = PopupLoggingPanel();
		var dialogBox = DialogBox();
		
		function PopupLoggingPanel() {
			var popupDiv = $('<div></div>');
			popupDiv.appendTo('body');
			var tabTitles = $('<ul></ul>');
			tabTitles.appendTo(popupDiv);
			var errorPanel = createPanel("Error Messages", 300, 'termgenie-logging-tabId-1');
			var messagePanel = createPanel("User Messages", 300, 'termgenie-logging-tabId-2');
			
			popupDiv.dialog({
				autoOpen: false,
				modal: true,
				draggable: true,
				resizable: true,
				minHeight: 450,
				minWidth: 500,
				title: 'Error Logging Console',
				buttons: [{
					text: "Clear",
					click: function() {
						var selected = popupDiv.tabs('option', 'selected');
						if (selected === 0) {
							errorPanel.clear();
						}
						else if (selected === 1) {
							messagePanel.clear();
						}
					}
				},{
					text: "Close Panel",
					click: function() {
						popupDiv.dialog('close');
					}
				}]
			});
			
			// create tabs in popup, using a custom prefix for tabId
			popupDiv.tabs({
				idPrefix: 'termgenie-logging-tabId-'
			});
			
			// register handler for link to show this panel
			$('#termgenie-error-console-link').click(function(){
				popupDiv.dialog('open');
			});
			
			function createPanel(name, maxCount, tabId) {
				tabTitles.append('<li><a href="'+tabId+'">'+name+'</a></li>');
				var container = $('<div id="'+tabId+'"></div>');
				container.appendTo(popupDiv);
				var contentContainer = $('<div style="overflow: scroll;position:absolute;height:75%;width:90%"></div>');
				container.append(contentContainer);
				return LoggingPanel(contentContainer, maxCount);
			}
			
			return {
				appendMessage: function(message){
					messagePanel.append(message);
					// do not force popup, as this is also reported via the dialog box
				},
				appendError: function(message, error, hidden) {
					errorPanel.append(message +' \n '+error);
					// force popup, except if hidden is true
					if (!(hidden === true)) {
						// select the error tab
						popupDiv.tabs('select', 0);
						// show error popup
						popupDiv.dialog('open');
					}
				}
			};
		}
		
		function LoggingPanel(parent, maxCount) {
			var count = 0;
			var loggingDiv = $('<div></div>');
			loggingDiv.appendTo(parent);
			
			function getCurrentTime(){
				var date = new Date();
				var timeString = date.getFullYear(); // four digit year
				timeString += '-';
				timeString = leadingZero(timeString, (1 + date.getMonth())); // month (0-11)
				timeString += '-';
				timeString = leadingZero(timeString, date.getDate()); // day in month 1-31
				timeString += ' ';
				timeString = leadingZero(timeString, date.getHours()); // 0-23
				timeString += ':';
				timeString = leadingZero(timeString, date.getMinutes()); // 0-59
				timeString += ':';
				timeString = leadingZero(timeString, date.getSeconds()); // 0-59
				return timeString;
				
				function leadingZero(string, value) {
					if (value < 10) {
						string += '0';
					}
					string += value;
					return string;
				}
			}
			
			return {
				append : function (message) {
					count += 1;
					loggingDiv.append('<div><span class="termgenie-logging-date-time">'+getCurrentTime()+'</span> '+message+'</div>');
					if (count > maxCount) {
						loggingDiv.children().first().remove();
					}
				},
				clear : function() {
					count = 0;
					loggingDiv.empty();
				}
			};
		}
		
		function DialogBox () {
			var dialogDiv = $('<div></div>');
			dialogDiv.appendTo('body');
			var dialogContent = $('<div></div>');
			dialogContent.appendTo(dialogDiv);
			dialogDiv.dialog({
				autoOpen: false,
				modal: true,
				draggable: true,
				resizable: true,
				title: 'Information',
				buttons: [{
					text: "Ok",
					click: function() {
						dialogDiv.dialog('close');
					}
				}]
			});
			
			return {
				show : function(message) {
					// write message also to hidden log
					popupLoggingPanel.appendMessage(message);
					
					// write message to dialog
					dialogContent.empty();
					dialogContent.append(message);
					dialogDiv.dialog('open');
				} 
			}
	}
		
		return {
			logSystemError : function(message, error, hidden) {
				popupLoggingPanel.appendError(message, error, hidden);
			},
			logUserMessage : function(message) {
				dialogBox.show(message);
			}
		};
	}
	
	// HTML wrapper functions
	
	function createAddRemoveWidget(parent, addfunction, removeFunction) {
		var addButton = $('<a class="myClickable">More</a>'); 
		var delButton = $('<a class="myClickable">Less</a>');
		var buttons = $('<span class="more-less-buttons"></span>');
		buttons.append(" (");
		buttons.append(addButton);
		buttons.append(", ");
		buttons.append(delButton);
		buttons.append(")");
		buttons.appendTo(parent);
		
		// click listener for add button
		addButton.click(addfunction);
		
		// click listener for remove button
		delButton.click(removeFunction);
	}
	
	function createLayoutTable() {
		return $(createLayoutTableOpenTag()+'</table>');
	}
	
	function createLayoutTableOpenTag() {
		return '<table class="termgenie-layout-table" cellSpacing="0" cellPadding="0">';
	}
	
	function createBusyMessage(additionalText) {
		return '<div class="termgenie-busy-message">'+
			'<img src="icon/wait26trans.gif" alt="Busy Icon"/>'+
			'<span class="termgenie-busy-message-text">Please wait.</span>'+
			'<div class="termgenie-busy-additional-text">'+additionalText+'</div><div>';
	}
	
	/**
	 * Helper for creating a div tag with an id and specified content.
	 * 
	 * @param id div id
	 * @param content html
	 */
	function c_div(id, content) {
		return '<div id="'+id+'">'+content+'</div>';
	}
	
	/**
	 * Helper for creating a span tag with an style class and specified content.
	 * 
	 * @param css css style class
	 * @param content html
	 */
	function c_span(css, content) {
		return '<span class="'+css+'">'+content+'</span>';
	}
	
	/**
	 * Helper for creating a button with an id and specified text.
	 * 
	 * @param id button id
	 * @param text text
	 */
	function c_button(id, text) {
		return '<button type="button" id="'+id+'">'+text+'</button>';
	}

	
	return {
		// empty object to hide any functionality
	};
};

// actuall call in jquery to execute the termgenie scripts after the document is ready
$(function(){
	// execute when document-ready
	termgenie();
});