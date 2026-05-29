sap.ui.define([
	"sap/dm/dme/podfoundation/component/production/ProductionUIComponent",
	"sap/ui/Device"
], function (ProductionUIComponent, Device) {
	"use strict";

	return ProductionUIComponent.extend("shs.custom.plugin.datacollectioneditui.datacollectioneditui.Component", {
		metadata: {
			manifest: "json"
		}
	});
});