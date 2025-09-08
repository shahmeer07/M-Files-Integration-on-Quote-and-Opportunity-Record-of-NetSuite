/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/https', 'N/log','N/record'], function (https, log,record) {
    function onRequest(context) {
        try {
            
            var recId = context.request.parameters.recordId
            var rec = record.load({ type: record.Type.OPPORTUNITY , id: recId})
            log.debug("Record Id in Suitelet: " , recId)

            var mfileslink = rec.getValue({ fieldId: 'custbody_tpc_mfiles_opportunity_link' });
            if (mfileslink && mfileslink.trim() !== '') {
                log.debug("Opportunity already linked to M-Files", mfileslink);
                context.response.write(
                    "Opportunity for this Record already exists in M-Files.<br>" +
                    "Link: <a target='_blank' href='" + mfileslink + "'>" + mfileslink + "</a>"
                );
                return;
            }

            var opportunityId = rec.getValue({ fieldId: "tranid"})
            var opportunityName = rec.getText({ fieldId: "entity"}) // Also is company name

            var opportunityValue = opportunityId + " " + opportunityName
            

            log.debug("Opportunity Id and Opportunity: ", opportunityId + " , " + opportunityName )

            var payload = {
                Username: 'NS-MFiles',
                Password: 'CleanAirRocks!',
                VaultGuid: '{05931937-E22E-488F-BDC9-F4EE366370F4}',
                Expiration:  "2025-09-30T10:36:29Z"
            };

            // Executing Token API via HTTPS POST
            var TokenResponse = https.post({
                url: 'https://mfiles.cleanairproducts.com/REST/server/authenticationtokens',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            var tokenBody = JSON.parse(TokenResponse.body)
            var token = tokenBody.Value

            log.debug("M-Files Token: ",token)

            var opportunityResponse = createInMFiles(token, "OT.NsOpportunity", "CL.NSOpportunity", [
                { "PropertyDef": "0", "Value": opportunityValue },
                { "PropertyDef": "PD.NsCompany", "Value": opportunityName }
            ]);

            // If Opportunity creation fails → create company → retry
            if (opportunityResponse.Error && opportunityResponse.Error.HasError) {
                log.debug("Opportunity Failed, Creating Company...", opportunityResponse.Error.ErrorMessage);

                var companyResponse = createInMFiles(token, "OT.NsCompany", "CL.NsCompany", [
                    { "PropertyDef": "0", "Value": opportunityName }
                ]);

                log.debug("Company Created", companyResponse);

                // Retry creating opportunity
                opportunityResponse = createInMFiles(token, "OT.NsOpportunity", "CL.NSOpportunity", [
                    { "PropertyDef": "0", "Value": opportunityValue },
                    { "PropertyDef": "PD.NsCompany", "Value": opportunityName }
                ]);
            }

            //  Update NS record if success
            if (opportunityResponse && !opportunityResponse.Error.HasError) {
                var oppUrl = opportunityResponse.WebClientUrl;

                rec.setValue({
                    fieldId: 'custbody_tpc_mfiles_opportunity_link',
                    value: oppUrl
                });
                rec.save();

                log.debug("Updated NS record with Opportunity URL", oppUrl);

                context.response.write("Opportunity created successfully.<br> M-Files Opportunity Link: <a target='_blank' href='" + oppUrl + "'>" + oppUrl + "</a>");
            } else {
                context.response.write("Opportunity creation failed. Response: " + JSON.stringify(opportunityResponse));
            }

        } catch (e) {
            log.error('Suitelet Error', e.message);
            context.response.write('Error: ' + e.message);
        }
    }
    function createInMFiles(token,objectType,objectClass,properties){
        var response = https.post({
            url: "https://mfiles.cleanairproducts.com/REST/vault/extensionmethod/CreateObject",
            headers:{
                "X-Authentication" : token,
                "Content-Type" : "application/json"
            },
            body: JSON.stringify({
                "APIKey" : "",
                "ObjectType" : objectType,
                "Class": objectClass,
                "Properties": properties
            })
        })

        log.debug(" M-Files create response( " + objectType + " ) " , response.body  )
        return JSON.parse(response.body)
    }

    return { onRequest };
});
