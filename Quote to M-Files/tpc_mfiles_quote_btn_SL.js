/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/https', 'N/log','N/record'], function (https, log,record) {
    function onRequest(context) {
        try {
            
            var recId = context.request.parameters.recordId
            log.debug("Quote Record ID Param:", JSON.stringify(context.request.parameters));
            log.debug("Quote Record ID: ",recId)
            var rec = record.load({ type: record.Type.ESTIMATE, id: recId })
            log.debug("Record Id in Suitelet: " , recId)

            var mfileslink = rec.getValue({
                fieldId: 'custbody_tpc_quote_to_mfiles_link',
                
            });

            if (mfileslink && mfileslink.trim() !== '') {
                context.response.write(
                    "Quote for this Record already exists in M-Files.<br>" +
                    "Please check the field <b>QUOTE TO M-FILES LINK</b>:<br>" +
                    "<a target='_blank' href='" + mfileslink + "'>" + mfileslink + "</a>"
                );
                return;
            }

            var quoteId = rec.getValue({ fieldId: "tranid"})
            var quoteName = rec.getText({ fieldId: "entity"}) // Also is company name

            var quoteValue = quoteId + " " + quoteName

            log.debug("Quote Id and Quote name: ", quoteId + " , " + quoteName )

            var opportunityId = rec.getValue('opportunity')

            var opportunityValue;

            if (!opportunityId) {
                context.response.write("This Quote cannot be sent to M-Files because it is not linked to an Opportunity. Please Check the Opportunity field in Quote Record");
                return;
            } else {
                
                var oppRec = record.load({
                    type: record.Type.OPPORTUNITY,
                    id: opportunityId
                });

                var oppTranId = oppRec.getValue('tranid');
                var oppEntity = oppRec.getText('entity'); 

                opportunityValue = oppTranId + " - " + oppEntity;

            }

            log.debug("opportunity value: " , opportunityValue)

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

            var quoteResponse = createInMFiles(token,"OT.NsQuote","CL.NSQuote",[
                {"PropertyDef" : "PD.NSQuoteID" , "Value" : "Quote of " + quoteValue},
                {"PropertyDef" : "PD.NSOpportunity" , "Value" : opportunityValue}
                
            ])

            if (quoteResponse && quoteResponse.Error && quoteResponse.Error.HasError){

                log.debug("Quote API Failed, Creating Opportunity...." , quoteResponse.Error.ErrorMessage)

                var opportunityResponse = createInMFiles(token , "OT.NsOpportunity", "CL.NSOpportunity", [
                    { "PropertyDef": "0", "Value": opportunityValue },
                    { "PropertyDef": "PD.NsCompany", "Value": quoteName }
                ])

                if (opportunityResponse.Error && opportunityResponse.Error.HasError) {
                    // --- Step 4: Create Company if missing ---
                    log.debug("Opportunity Failed, Creating Company...", opportunityResponse.Error.ErrorMessage);

                    var companyResponse = createInMFiles(token,"OT.NsCompany", "CL.NsCompany", [
                        { "PropertyDef": "0", "Value": quoteName }
                    ]);

                    log.debug("Company Created", companyResponse);
                
                     opportunityResponse = createInMFiles(token , "OT.NsOpportunity", "CL.NSOpportunity", [
                        { "PropertyDef": "0", "Value": opportunityValue },
                        { "PropertyDef": "PD.NsCompany", "Value": quoteName }
                    ])
            }

             quoteResponse = createInMFiles(token,"OT.NsQuote","CL.NSQuote",[
                {"PropertyDef" : "PD.NSQuoteID" , "Value" : "Quote of " + quoteValue},
                {"PropertyDef" : "PD.NSOpportunity" , "Value" : opportunityValue}
                
            ])
        }

        if (quoteResponse && !quoteResponse.Error.HasError) {
            var quoteUrl = quoteResponse.WebClientUrl;
        
           
            rec.setValue({
                fieldId: 'custbody_tpc_quote_to_mfiles_link',
                value: quoteUrl
            });
            rec.save();
        
            log.debug("Updated NS record with Quote URL", quoteUrl);
        
           
            context.response.write("Quote created successfully. <br> M-Files Quote Link: <a target='_blank' href='" + quoteUrl + "'>" + quoteUrl + "</a>");
        } else {
            context.response.write("Quote creation failed. Response: " + JSON.stringify(quoteResponse));
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
