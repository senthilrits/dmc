sap.ui.define([
    'jquery.sap.global',
    "sap/dm/dme/podfoundation/controller/PluginViewController",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "shs/custom/plugin/componenttemplate/componenttemplate/js/sfcvaluehelpdialog",
    "shs/custom/plugin/componenttemplate/componenttemplate/js/dcgroupValueHelp",
    "shs/custom/plugin/componenttemplate/componenttemplate/js/parametervaluehelpdialog",
    "sap/m/Dialog",
    "sap/m/library",
    "sap/m/Text",
    "sap/m/Button",
    /* "shs/custom/plugin/componenttemplate/js/sfcvaluehelpdialog",
    "shs/custom/plugin/componenttemplate/js/dcgroupValueHelp",
    "shs/custom/plugin/componenttemplate/js/parametervaluehelpdialog"*/
], function (jQuery, PluginViewController, JSONModel, MessageToast, sfcvaluehelpdialog, dcgroupValueHelp,
    parametervaluehelpdialog, Dialog, library, Text, Button) {
    "use strict";

    var ButtonType = library.ButtonType;
    // shortcut for sap.m.DialogType
    var DialogType = library.DialogType;

    return PluginViewController.extend("shs.custom.plugin.datacollectioneditui.datacollectioneditui.controller.datacollectionedit", {
        SFCWorkListPpdURL: '',
        DCGroupPpdURL: '',
        DCCollectURL: '',
        DCLogURL: '',
        IsComment: '',
        DCParameterPPDURL: '',
        I18nServicePpdURL: '',
        oBundle: '',
        onInit: function () {
            PluginViewController.prototype.onInit.apply(this, arguments);

        },
        _setBusy: function (bBusy) {
            this.getView().setBusy(bBusy);
        },

        onAfterRendering: function () {
            //this.getView().byId("backButton").setVisible(this.getConfiguration().backButtonVisible);
            //this.getView().byId("closeButton").setVisible(this.getConfiguration().closeButtonVisible);
            //this.getView().byId("headerTitle").setText(this.getConfiguration().title);
            //this.getView().byId("textPlugin").setText(this.getConfiguration().text); 

            this.SFCWorkListPpdURL = this.getConfiguration().sfcWorkListUrl;
            this.DCGroupPpdURL = this.getConfiguration().dcgroupppdurl;
            this.DCCollectURL = this.getConfiguration().dccollecturl;
            this.DCLogURL = this.getConfiguration().logdcurl;
            this.IsComment = this.getConfiguration().isCommentEnabled;
            this.DCParameterPPDURL = this.getConfiguration().dcParameterPPDUrl;
            this.I18nServicePpdURL = this.getConfiguration().i18nPpdUrl;
            this.oBundle = this.getView().getModel("i18n").getResourceBundle();

            // var currentPlant = this.getPodController().getUserPlant();
            var sPlant = this.getPodController().getUserPlant();
            var sUserId = this.getPodController().getUserId();

            // Convert to uppercase safely
            var sUserIdUpper = sUserId ? sUserId.toUpperCase() : "";

            var oViewModel = new sap.ui.model.json.JSONModel({
                currentPlant: sPlant,
                userId: sUserIdUpper
            });

            this.getView().setModel(oViewModel, "viewModel");

            sfcvaluehelpdialog.onLoad(this, this.SFCWorkListPpdURL);
            dcgroupValueHelp.retrieveDcgroup(this, this.DCGroupPpdURL);
            parametervaluehelpdialog.retrieveParameterDetails(this, this.DCParameterPPDURL);
            this.getI18nErrorMessageDetails(this.I18nServicePpdURL);
            //this.onSearchPress(this.DCLogURL);

            if (this.getPodSelectionModel().getInputValue() == undefined) {
                this.getView().byId("inpDcGroup").setEditable(false);
                this.getView().byId("inpParameter").setEditable(false);
            } else {
                var selectedSfc = this.getPodSelectionModel().getInputValue();
                this.getView().byId("inpSfc").setValue(selectedSfc);

                this.getView().byId("inpDcGroup").setEditable(true);
                this.getView().byId("inpParameter").setEditable(true);
                this.getView().byId("inpSfc").setEditable(false);
                this.loadLogDCDetails();
            }
        },

        onSearchPress: function () {

            var oBundle = this.getView().getModel("i18n").getResourceBundle();

            var sDcGroup = this.byId("inpDcGroup").getValue();
            var sVersion = this.byId("inpVersion").getValue();
            var sParameter = this.byId("inpParameter").getValue();
            var sSfc = this.byId("inpSfc").getValue();

            // Mandatory validation (SFC)
            if (!sSfc) {
                this.byId("inpSfc").setValueState("Error");
                //MessageToast.show(oBundle.getText("ERR_SFC_REQUIRED"));
                MessageToast.show(this._getErrorMessage("9305"));
                this._setBusy(false);
                this.onClearFiltersPress();
                return;
            }
            if (sDcGroup == "")
                this.byId("inpVersion").setValue("");

            this.byId("inpSfc").setValueState("None");


            /*let aFilteredResults = this.getView().getModel("loadLogDCDetails").getData().results.filter(item => {
                // If user selected a DC Group, item must match. If not, this check is true.
                const matchesGroup = this.byId("inpDcGroup").getValue()
                    ? item.DC_GROUP === this.byId("inpDcGroup").getValue()
                    : true;

                // If user selected a Parameter, item must match. If not, this check is true.
                const matchesParameter = this.byId("inpParameter").getValue()
                    ? item.DC_PARAMETER_NAME === this.byId("inpParameter").getValue()
                    : true;

                // Item must satisfy BOTH conditions (if they are active)
                return matchesGroup && matchesParameter;
            })
            var oModel = new JSONModel({
                results: aFilteredResults
            });

            this.getView().setModel(oModel, "dcLogModel");*/

            // Build URL
            var sUrl = this.getPublicApiRestDataSourceUri() + this.DCLogURL;

            // Prepare payload
            var oPayload = {
                inPlant: this.getPodController().getUserPlant(),
                inDCGroup: sDcGroup,
                inDCGroupVersion: sVersion,
                inDCParam: sParameter,
                inSFC: sSfc
            };
            console.log("Payload For Log DcGroupDetails:", oPayload);
            // API Call
            this.ajaxPostRequest(
                sUrl,
                oPayload,
                function (oResponseData) {

                    console.log("Search Response:", oResponseData);
                    var oRawData = oResponseData.DCGroupandParamDetails;
                    //If backend sends stringified JSON
                    if (typeof oRawData === "string") {
                        try {
                            oRawData = JSON.parse(oRawData);
                        } catch (e) {
                            console.error("Invalid JSON format from API", e);
                            oRawData = [];
                        }
                    }
                    // Ensure always array
                    if (!Array.isArray(oRawData)) {
                        oRawData = [];
                    }
                    // Historian Table
                    var oModel = new JSONModel({
                        historianResults: oRawData
                    });

                    this.getView().setModel(oModel, "historianLogModel");
                    this.getView().getModel("historianLogModel").refresh(true);

                    // latest first
                    oRawData.sort(function (a, b) {
                        return new Date(b.CREATED_AT) - new Date(a.CREATED_AT);
                    });

                    // Keep only latest unique parameter entries
                    var oUniqueMap = {};
                    var aFilteredResults = [];

                    oRawData.forEach(function (item) {

                        var sKey = item.DC_GROUP + "_" + item.DC_PARAMETER_NAME;

                        if (!oUniqueMap[sKey]) {
                            oUniqueMap[sKey] = true;
                            aFilteredResults.push(item);
                        }

                    });

                    if (aFilteredResults.length === 0) {
                        // MessageToast.show(oBundle.getText("MSG_NO_DC_DETAILS"));
                        MessageToast.show(this._getErrorMessage("9301"));
                        this._setBusy(false);
                        this.onClearFiltersPress();
                        if (this.getPodSelectionModel().getInputValue() != undefined) {
                            var selectedSfc = this.getPodSelectionModel().getInputValue();
                            this.getView().byId("inpSfc").setValue(selectedSfc);
                        }
                        return;
                    } else {
                        this.getView().byId("inpDcGroup").setEditable(true);
                        this.getView().byId("inpParameter").setEditable(true);

                        //Bind filtered results
                        var oModel = new JSONModel({
                            results: aFilteredResults
                        });

                        this.getView().setModel(oModel, "dcLogModel");
                        this.getView().getModel("dcLogModel").refresh(true);
                        this.getView().setModel(oModel, "loadLogDCDetails");
                        this.getView().getModel("loadLogDCDetails").refresh(true);
                    }
                    this._setBusy(false);

                }.bind(this),

                function (oError) {
                    console.error("Search failed", oError);
                    this._setBusy(false);
                }.bind(this)
            );
        },


        /* onClearFiltersPress: function (oEvent) {
            this.byId("inpDcGroup").setValue("");
            this.byId("inpVersion").setValue("");
            this.byId("inpParameter").setValue("");
            this.byId("inpSfc").setValue("");

            this.getView().byId("inpDcGroup").setEditable(false);
            this.getView().byId("inpParameter").setEditable(false);

            var oModel = this.getView().getModel("dcLogModel");
            if (oModel) {
                oModel.setProperty("/results", []);
                //oModel.refresh(true); 
            }
            this.getView().getModel("dcLogModel").setData({});
            this.getView().getModel("loadLogDCDetails").setData({});

        },*/
        onClearFiltersPress: function () {

            this.byId("inpDcGroup").setValue("");
            this.byId("inpVersion").setValue("");
            this.byId("inpParameter").setValue("");
            this.byId("inpSfc").setValue("");

            this.byId("inpDcGroup").setEditable(false);
            this.byId("inpParameter").setEditable(false);

            var oDcLogModel = this.getView().getModel("dcLogModel");
            if (oDcLogModel) {
                oDcLogModel.setData({ results: [] });
            }

            var oLoadModel = this.getView().getModel("loadLogDCDetails");
            if (oLoadModel) {
                oLoadModel.setData({ results: [] });
            }
        },


        onOpenDCEditDialog: function (oEvent) {

            var oContext = oEvent.getSource().getBindingContext("dcLogModel");
            if (!oContext) return;

            var oRowData = oContext.getObject();
            // Extract comment safely
            /* var sStoredComment = oRowData.COMMENT || "";
            var sCleanComment = "";

            if (sStoredComment && sStoredComment.includes("-")) {
                sCleanComment = sStoredComment.split("-")[0];
            } else {
                sCleanComment = sStoredComment; // in case no dash exists
            }*/
            // Store context for later update
            // this._selectedRowContext = oContext;

            // Store selection info
            this._selectedDcGroup = oRowData.DC_GROUP;
            this._selectedParameter = oRowData.DC_PARAMETER_NAME;
            this._selectedSfc = oRowData.SFC;

            var oDialogModel = new JSONModel({
                id: oRowData.ID,
                plant: oRowData.PLANT,
                dcGroup: oRowData.DC_GROUP,
                version: oRowData.DC_GROUP_VERSION,
                operation: oRowData.OPERATION_ACTIVITY,
                operationVersion: oRowData.OPERATION_ACTIVITY_VERSION,
                parameter: oRowData.DC_PARAMETER_NAME,
                currentValue: oRowData.DC_PARAMETER_VALUE,
                maxValue: oRowData.MAX_VALUE,
                minValue: oRowData.MIN_VALUE,
                resource: oRowData.RESOURCE,
                workcenter: oRowData.WORKCENTER,
                sfc: oRowData.SFC,
                shopOrder: oRowData.MFG_ORDER,
                createdAt: oRowData.CREATED_AT,
                user: this.getPodController().getUserId(),
                newValue: "",
                comment: "",
                isCommentRequired: this.IsComment === true
            });

            var oDialog = this.byId("dlgDcEdit");
            oDialog.setModel(oDialogModel, "dcModel");
            this._bindSelectedParameterHistory();
            oDialog.open();
        },

        onNcConfirmationDialogue: function () {
            var oDialog = this.byId("dlgDcEdit");
            var oModel = oDialog.getModel("dcModel");
            var autoLogNcParam = this.getView().getModel("dcLogModel").getData().results.filter(ele => ele.DC_GROUP == oModel.getProperty("/dcGroup") && ele.DC_PARAMETER_NAME == oModel.getProperty("/parameter"))[0];
            var hasAutoLogNc = autoLogNcParam.IS_AUTO_LOG_NC;
            var paramType = autoLogNcParam.DC_PARAMETER_TYPE;
            hasAutoLogNc = (String(hasAutoLogNc).toLowerCase() === 'true');
            var newValue = this.byId("dlgDcEdit").getModel("dcModel").getProperty("/newValue");

            if (paramType == "NUMBER") {
                /*if (hasAutoLogNc && (autoLogNcParam.MIN_VALUE > newValue || autoLogNcParam.MAX_VALUE < newValue)) {
                    this.onAutoLogNcApproveDialogPress(hasAutoLogNc);
                }
                else if (autoLogNcParam.MIN_VALUE > newValue || autoLogNcParam.MAX_VALUE < newValue) {
                    this.onAutoLogNcApproveDialogPress(hasAutoLogNc);
                }
                else {
                    this.onSavePress();
                }*/
                if (newValue >= autoLogNcParam.MIN_VALUE && newValue <= autoLogNcParam.MAX_VALUE) {
                    this.onSavePress();
                }
                else {
                    this.onAutoLogNcApproveDialogPress(hasAutoLogNc);
                }
            } else {
                this.onSavePress();
            }


        },

        onSavePress: function () {
            // this._setBusy(true);
            var oDialog = this.byId("dlgDcEdit");
            var oModel = oDialog.getModel("dcModel");
            var oBundle = this.getView().getModel("i18n").getResourceBundle();
            var sNewValue = oModel.getProperty("/newValue");
            var sComment = oModel.getProperty("/comment");
            var sId = oModel.getProperty("/id");
            var bCommentRequired = oModel.getProperty("/isCommentRequired");

            if (!sNewValue) {
                // MessageToast.show(oBundle.getText("ERR_NEW_VALUE_REQUIRED"));
                MessageToast.show(this._getErrorMessage("9302"));
                //this._setBusy(false); 
                return;
            }
            // Validate Comment ONLY if required
            if (bCommentRequired) {
                if (sComment == "" || sComment == null || sComment == undefined) {
                    //MessageToast.show(oBundle.getText("ERR_COMMENT_REQUIRED"));
                    MessageToast.show(this._getErrorMessage("9303"));
                    // this._setBusy(false); 
                    return;
                }

            }

            var sFinalComment = sComment ? sComment + "-" + sId : sId;

            var aRequest = [
                {
                    DC_GROUP: oModel.getProperty("/dcGroup"),
                    DC_GROUP_VERSION: oModel.getProperty("/version"),
                    OPERATION_ACTIVITY: oModel.getProperty("/operation"),
                    OPERATION_ACTIVITY_VERSION: oModel.getProperty("/operationVersion"),
                    DC_PARAMETER_NAME: oModel.getProperty("/parameter"),
                    DC_PARAMETER_VALUE: sNewValue,
                    RESOURCE: oModel.getProperty("/resource"),
                    WORKCENTER: oModel.getProperty("/workcenter"),
                    SFC: oModel.getProperty("/sfc"),
                    COMMENT: sFinalComment
                }
            ];

            var oPayload = {
                inDCLogRequest: JSON.stringify(aRequest),
                inPlant: this.getPodController().getUserPlant()
            };

            var sUrl = this.getPublicApiRestDataSourceUri() + this.DCCollectURL;

            this.ajaxPostRequest(
                sUrl,
                oPayload,
                function (oResponse) {
                    var bSuccess = oResponse && (oResponse.outResponse === true || oResponse.outResponse === "true");
                    if (bSuccess) {
                        MessageToast.show(oBundle.getText("MSG_DC_UPDATE_SUCCESS"));
                        oDialog.close();
                        this.onSearchPress();

                    } else {
                        // MessageToast.show(oBundle.getText("ERR_DC_UPDATE_FAILED"));
                        MessageToast.show(this._getErrorMessage("9304"));
                        //this._setBusy(false); 
                        return;
                    }
                    //this._setBusy(false); 

                }.bind(this),

                function (oError) {
                    console.error("Update failed", oError);
                    // MessageToast.show(oBundle.getText("ERR_DC_UPDATE_ERROR"));
                    MessageToast.show(this._getErrorMessage("9306"));
                    //this._setBusy(false); 
                    oDialog.close();

                }.bind(this)
            );
        },

        onCancelPress: function () {
            this.byId("dlgDcEdit").close();
        },


        onBeforeRenderingPlugin: function () {
        },

        isSubscribingToNotifications: function () {
            var bNotificationsEnabled = true;
            return bNotificationsEnabled;
        },
        onCreateOrderClick: function (oEvent) {
            sap.m.MessageToast.show("Order request send to S/4 successfully.")
        },
        onDatePickerClick: function (oEvent) {
            let oToday = new Date();  // Current date [web:44][web:50]
            oToday.setHours(0, 0, 0, 0);
            this.byId(oEvent.mParameters.id).setMinDate(oToday);
        },
        onValueHelpRequest: function () {
            sfcvaluehelpdialog.handleValueHelp(this);
        },

        onValueHelpDCRequest: function () {
            var sSfc = this.byId("inpSfc").getValue();
            dcgroupValueHelp.handleDcgroupValueHelp(this, sSfc);
        },

        onValueHelpParamRequest: function () {
            var sDcGroup = this.byId("inpDcGroup").getValue();
            parametervaluehelpdialog.handleParameterValueHelp(this, sDcGroup);
        },

        onValueHelpParamSelect: function (oEvent) {
            var dcParameterModel = oEvent.oSource.getSelectedItems()[0].oBindingContexts.dcParameterModel,
                selectedIndex = Number(dcParameterModel.sPath.replace("/dcParameterResponseList/", "")),
                oSelectedParam = dcParameterModel.oModel.oData.dcParameterResponseList[selectedIndex].PARAMETER_NAME;
            this.getView().byId("inpParameter").setValue(oSelectedParam);
            this._ParamValueHelpDialog.close();

        },

        onValueHelpSelect: function (oEvent) {
            var sfcModel = oEvent.oSource.getSelectedItems()[0].oBindingContexts.sfcModel,
                selectedIndex = Number(sfcModel.sPath.replace("/sfcList/", "")),
                oSelectedSfc = sfcModel.oModel.oData.sfcList[selectedIndex].SFC;
            this.getView().byId("inpSfc").setValue(oSelectedSfc);

            this.getView().byId("inpDcGroup").setValue("");
            this.getView().byId("inpVersion").setValue("");
            this.getView().byId("inpParameter").setValue("");
            this.getView().byId("inpDcGroup").setEditable(true);
            this.getView().byId("inpParameter").setEditable(true);
            //this.onSfcChange("");
            // Close the value help dialog
            this._valueHelpDialog.close();
            this.onClearFilter(oEvent);
            this.loadLogDCDetails();
        },

        // User can Enter/Scan SFC Manually
        onSfcManualChange: function (oEvent) {
            var sEnteredSfc = oEvent.getSource().getValue().trim();
            if (!sEnteredSfc) {
                return;
            }
            var oModel = this.getView().getModel("sfcModel");

            if (!oModel) {
                console.warn("sfcModel not loaded yet");
                return;
            }
            var aSfcList = oModel.getProperty("/sfcList");

            // Check if entered SFC exists in loaded list
            var oMatch = aSfcList.find(function (item) {
                return item.SFC === sEnteredSfc;
            });

            if (!oMatch) {
                MessageToast.show("Invalid SFC");
                oEvent.getSource().setValue("");
                return;
            }

            this.byId("inpDcGroup").setValue("");
            this.byId("inpVersion").setValue("");
            this.byId("inpParameter").setValue("");

            this.byId("inpDcGroup").setEditable(true);
            this.byId("inpParameter").setEditable(true);

            this.loadLogDCDetails();
        },

        onValueHelpDcgroupSelect: function (oEvent) {

            var dcgroupModel = oEvent.oSource.getSelectedItems()[0].oBindingContexts.dcgroupModel,
                selectedIndex = Number(dcgroupModel.sPath.replace("/dcgroupResponseList/", "")),
                oSelectedDcgroup = dcgroupModel.oModel.oData.dcgroupResponseList[selectedIndex].DC_GROUP;
            this.getView().byId("inpDcGroup").setValue(oSelectedDcgroup);
            this.getView().byId("inpVersion").setValue(dcgroupModel.oModel.oData.dcgroupResponseList[selectedIndex].VERSION);

            this._DCvalueHelpDialog.close();
            this.onClearFilterDcgroup(oEvent);
            this.getView().byId("inpParameter").setValue("");
        },
        onSearch: function (oEvent) {
            sfcvaluehelpdialog.onSearch(oEvent, this);
        },
        onSearchDcgroup: function (oEvent) {
            dcgroupValueHelp.onSearchDcgroup(oEvent, this);
        },
        onSearchParam: function (oEvent) {
            parametervaluehelpdialog.onSearchParam(oEvent, this);
        },
        onClearFilter: function (oEvent) {
            sfcvaluehelpdialog.onClearFilter(oEvent, this);
        },
        onClearFilterDcgroup: function (oEvent) {
            dcgroupValueHelp.onClearFilterDcgroup(oEvent, this);
        },
        onClearFilterParam: function (oEvent) {
            parametervaluehelpdialog.onClearFilterParam(oEvent, this);
        },

        /*
                _bindSelectedParameterHistory: function () {
        
                    var oFullModel = this.getView().getModel("historianLogModel");
                    if (!oFullModel) return;
        
                    var aAllData = oFullModel.getProperty("/historianResults");
                    if (!Array.isArray(aAllData)) return;
        
                    // Filter selected parameter
                    var aFiltered = aAllData.filter(function (item) {
                        return item.DC_GROUP === this._selectedDcGroup &&
                            item.DC_PARAMETER_NAME === this._selectedParameter &&
                            item.SFC === this._selectedSfc;
                    }.bind(this));
        
                    // Sort latest first
                    aFiltered.sort(function (a, b) {
                        return new Date(b.CREATED_AT) - new Date(a.CREATED_AT);
                    });
        
                    if (aFiltered.length === 0) return;
        
                    var aHistoryFormatted = [];
        
                    // Latest record
                    var oLatest = aFiltered[0];
        
                    aHistoryFormatted.push({
                        previousValue: aFiltered.length > 1 ? aFiltered[1].DC_PARAMETER_VALUE : "-",
                        newValue: oLatest.DC_PARAMETER_VALUE,
                        createdAt: oLatest.CREATED_AT,
                        user: oLatest.USER_ID,
                        comment: oLatest.COMMENT != null ? oLatest.COMMENT.split("-")[0] : ""
        
        
                    });
        
        
                    // Remaining older values go only to Previous column
                    for (var i = 1; i < aFiltered.length; i++) {
        
                        aHistoryFormatted.push({
                            previousValue: aFiltered[i].DC_PARAMETER_VALUE,
                            newValue: "",  // keep empty
                            createdAt: aFiltered[i].CREATED_AT,
                            user: aFiltered[i].USER_ID,
                            comment: aFiltered[i].COMMENT != null ? aFiltered[i].COMMENT.split("-")[0] : ""
                        });
                    }
        
                    var oHistoryModel = new JSONModel({
                        historyResults: aHistoryFormatted
                    });
        
                    this.byId("dlgDcEdit").setModel(oHistoryModel, "selectedHistoryModel");
                },*/


        //Commented for history not working as expected, need to rework on logic 
        /*  _bindSelectedParameterHistory: function () {
  
              var oFullModel = this.getView().getModel("historianLogModel");
              if (!oFullModel) return;
  
              var aAllData = oFullModel.getProperty("/historianResults");
              if (!Array.isArray(aAllData)) return;
  
              var aFiltered = aAllData.filter(function (item) {
                  return item.DC_GROUP === this._selectedDcGroup &&
                      item.DC_PARAMETER_NAME === this._selectedParameter &&
                      item.SFC === this._selectedSfc;
              }.bind(this));
  
              if (aFiltered.length === 0) return;
  
              // Build ID Map
              var idMap = {};
              aFiltered.forEach(function (item) {
                  idMap[item.ID] = item;
              });
  
              // Find oldest record (COMMENT null)
              var startRecord = aFiltered.find(function (item) {
                  return !item.COMMENT;
              });
  
              if (!startRecord) return;
  
              var valueChain = [];
              var current = startRecord;
  
              while (current) {
  
                  valueChain.push(current);
  
                  // Find next record referencing this ID
                  var next = aFiltered.find(function (item) {
                      return item.COMMENT && item.COMMENT.split("-")[1] === current.ID;
                  });
  
                  current = next;
              }
  
              // Build UI rows
              var aHistoryFormatted = [];
  
              for (var i = valueChain.length - 1; i >= 0; i--) {
  
                  var prev = (i > 0) ? valueChain[i - 1].DC_PARAMETER_VALUE : "";
                  var curr = valueChain[i].DC_PARAMETER_VALUE;
  
                  aHistoryFormatted.push({
                      previousValue: prev,
                      newValue: curr,
                      createdAt: valueChain[i].CREATED_AT,
                      user: valueChain[i].USER_ID,
                      comment: valueChain[i].COMMENT ? valueChain[i].COMMENT.split("-")[0] : ""
                  });
              }
  
              // Add the first base value row
              // aHistoryFormatted.push({
              //     previousValue: "",
              //     newValue: valueChain[0].DC_PARAMETER_VALUE,
              //     createdAt: valueChain[0].CREATED_AT,
              //     user: valueChain[0].USER_ID,
              //     comment: ""
              // });
  
              var oHistoryModel = new JSONModel({
                  historyResults: aHistoryFormatted
              });
  
              this.byId("dlgDcEdit").setModel(oHistoryModel, "selectedHistoryModel");
          },*/


        _bindSelectedParameterHistory: function () {
            var oFullModel = this.getView().getModel("historianLogModel");
            if (!oFullModel) return;

            var aAllData = oFullModel.getProperty("/historianResults");
            if (!Array.isArray(aAllData)) return;

            var aFiltered = aAllData.filter(function (item) {
                return item.DC_GROUP === this._selectedDcGroup &&
                    item.DC_PARAMETER_NAME === this._selectedParameter &&
                    item.SFC === this._selectedSfc;
            }.bind(this));

            if (!aFiltered.length) return;

            // Build chain from oldest to latest
            var aSorted = aFiltered.slice().sort(function (a, b) {
                return new Date(a.CREATED_AT) - new Date(b.CREATED_AT);
            });

            var valueChain = [];
            var visited = {};
            var current = aSorted[0];

            while (current && !visited[current.ID]) {
                valueChain.push(current);
                visited[current.ID] = true;

                var currentIndex = aSorted.findIndex(function (item) {
                    return item.ID === current.ID;
                });

                var next = aSorted.find(function (item) {
                    var aCommentParts = item.COMMENT && item.COMMENT.split("-");

                    return !visited[item.ID] &&
                        aCommentParts &&
                        aCommentParts[aCommentParts.length - 1] === current.ID;
                });

                // Continue even when COMMENT is null or has no previous ID
                current = next || aSorted[currentIndex + 1];
            }

            // Latest on top
            valueChain.reverse();

            var aHistoryFormatted = valueChain.map(function (item, index) {
                var oPreviousRecord = valueChain[index + 1];

                return {
                    previousValue: oPreviousRecord ? oPreviousRecord.DC_PARAMETER_VALUE : "",
                    newValue: item.DC_PARAMETER_VALUE,
                    createdAt: item.CREATED_AT,
                    user: item.USER_ID,
                    comment: item.COMMENT ? item.COMMENT.split("-")[0] : ""
                };
            });

            var oHistoryModel = new JSONModel({
                historyResults: aHistoryFormatted
            });

            this.byId("dlgDcEdit").setModel(oHistoryModel, "selectedHistoryModel");
        },
        getCustomNotificationEvents: function (sTopic) {
            //return ["template"];
        },

        getNotificationMessageHandler: function (sTopic) {
            //if (sTopic === "template") {
            //    return this._handleNotificationMessage;
            //}
            return null;
        },

        _handleNotificationMessage: function (oMsg) {
            var sMessage = "Message not found in payload 'message' property";
            if (oMsg && oMsg.parameters && oMsg.parameters.length > 0) {
                for (var i = 0; i < oMsg.parameters.length; i++) {

                    switch (oMsg.parameters[i].name) {
                        case "template":

                            break;
                        case "template2":
                    }
                }
            }

        },

        onExit: function () {
            PluginViewController.prototype.onExit.apply(this, arguments);
        },

        loadLogDCDetails: function () {
            this._setBusy(true);
            var oBundle = this.getView().getModel("i18n").getResourceBundle();
            var sDcGroup = this.byId("inpDcGroup").getValue();
            var sVersion = this.byId("inpVersion").getValue();
            var sParameter = this.byId("inpParameter").getValue();
            var sSfc = this.byId("inpSfc").getValue();

            // Mandatory validation (SFC)
            if (!sSfc) {
                this.byId("inpSfc").setValueState("Error");
                // MessageToast.show(oBundle.getText("ERR_SFC_REQUIRED"));
                MessageToast.show(this._getErrorMessage("9305"));
                this._setBusy(false);
                return;
            }

            this.byId("inpSfc").setValueState("None");

            // Build URL
            var sUrl = this.getPublicApiRestDataSourceUri() + this.DCLogURL;

            // Prepare payload
            var oPayload = {
                inPlant: this.getPodController().getUserPlant(),
                inDCGroup: sDcGroup,
                inDCGroupVersion: sVersion,
                inDCParam: sParameter,
                inSFC: sSfc
            };
            console.log("Payload For Log DcGroupDetails:", oPayload);
            // API Call
            this.ajaxPostRequest(
                sUrl,
                oPayload,
                function (oResponseData) {

                    console.log("Search Response:", oResponseData);
                    var oRawData = oResponseData.DCGroupandParamDetails;
                    //console.log("DC Group Log Details: ", oRawData);

                    //If backend sends stringified JSON
                    if (typeof oRawData === "string") {
                        try {
                            oRawData = JSON.parse(oRawData);
                        } catch (e) {
                            console.error("Invalid JSON format from API", e);
                            oRawData = [];
                        }
                    }
                    // Ensure always array
                    if (!Array.isArray(oRawData)) {
                        oRawData = [];
                    }
                    // Historian Table
                    var oModel = new JSONModel({
                        historianResults: oRawData
                    });

                    this.getView().setModel(oModel, "historianLogModel");

                    // latest first
                    oRawData.sort(function (a, b) {
                        return new Date(b.CREATED_AT) - new Date(a.CREATED_AT);
                    });

                    // Keep only latest unique parameter entries
                    var oUniqueMap = {};
                    var aFilteredResults = [];

                    oRawData.forEach(function (item) {

                        var sKey = item.DC_GROUP + "_" + item.DC_PARAMETER_NAME;

                        if (!oUniqueMap[sKey]) {
                            oUniqueMap[sKey] = true;
                            aFilteredResults.push(item);
                        }

                    });

                    if (aFilteredResults.length === 0) {
                        // MessageToast.show(oBundle.getText("MSG_NO_DC_DETAILS"));
                        MessageToast.show(this._getErrorMessage("9301"));
                        this._setBusy(false);
                        this.onClearFiltersPress();
                        return;
                    } else {

                        //Bind filtered results
                        var oModel = new JSONModel({
                            results: aFilteredResults
                        });

                        this.getView().setModel(oModel, "loadLogDCDetails");
                    }
                    this._setBusy(false);

                }.bind(this),

                function (oError) {
                    console.error("Search failed", oError);
                    this._setBusy(false);
                }.bind(this)
            );
        },

        /**
         * Fetch localized error message from I18n Service
         * @param {string} sServiceUrl - I18n service endpoint
         * @param {string} sErrorCode - Error code to retrieve message
         * @param {Array} aParameters - Optional parameters for message placeholders
         */
        getI18nErrorMessageDetails: function (sServiceUrl) {

            var sUrl = this.getPublicApiRestDataSourceUri() + sServiceUrl;

            var sBrowserLanguage = sap.ui.getCore().getConfiguration().getLanguage();

            var aErrorRequest = [{
                errorCode: "",
                parameters: []
            }];

            var oPayload = {
                inLanguageCode: sBrowserLanguage,
                // inErrorRequest: aErrorRequest Optional
            };

            console.log("I18n Service Request Payload:", oPayload);

            this.ajaxPostRequest(
                sUrl,
                oPayload,

                function (oResponseData) {
                    console.log("I18n Service Response:", oResponseData);
                    var aErrorCodesMessages = [];
                    aErrorCodesMessages = oResponseData.I18nResponse.results;
                    console.log("Error Codes And Messages:", aErrorCodesMessages);

                    var oErrorMessageModel = new sap.ui.model.json.JSONModel({
                        errorMessages: aErrorCodesMessages
                    });
                    this.getView().setModel(oErrorMessageModel, "i18nErrorModel");

                }.bind(this),

                function (oError) {
                    console.error("I18n Service API call failed:", oError);
                }
            );
        },

        _getErrorMessage: function (sCode, aParams) {
            var oErrorModel = this.getView().getModel("i18nErrorModel");
            var aErrors = oErrorModel ? oErrorModel.getProperty("/errorMessages") : [];

            var oError = aErrors.find(function (item) {
                return item.errorCode === sCode;
            });
            if (!oError) {
                return "Unknown Error";
            }
            var sMessage = oError.message;
            if (Array.isArray(aParams)) {
                aParams.forEach(function (param, index) {
                    sMessage = sMessage.replace("{" + index + "}", param);
                });
            }
            return sMessage;
        },
        onAutoLogNcApproveDialogPress: function (hasAutoLogNc) {
            if (this.oApproveDialog) {
                this.oApproveDialog.destroy();
                this.oApproveDialog = null;
            }
            this.oApproveDialog = new Dialog({
                type: DialogType.Message,
                title: "Confirm",
                content: new Text({ text: hasAutoLogNc ? this.oBundle.getText("AUTO_LOG_NC_CONFIRMATION_MSG") : this.oBundle.getText("OVERRRIDE_CONFIRMATION_MSG") }),
                beginButton: new Button({
                    type: ButtonType.Emphasized,
                    text: "Submit",
                    press: function () {
                        this.onSavePress();
                        this.oApproveDialog.close();
                    }.bind(this)
                }),
                endButton: new Button({
                    text: "Cancel",
                    press: function () {
                        this.oApproveDialog.close();
                    }.bind(this)
                })
            });


            this.oApproveDialog.open();
        },

    });
});