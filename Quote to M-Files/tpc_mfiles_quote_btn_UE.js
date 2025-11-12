/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/https', 'N/log', 'N/record','N/ui/serverWidget'], function (https, log, record,serverWidget) {
    
    function beforeLoad(context) {
        try {
          if (context.type !== context.UserEventType.VIEW) return;
    
          var form = context.form;
          var rec = context.newRecord;
    
          // Adjust these to your actual field IDs
          var webFieldId = 'custbody_tpc_quote_to_mfiles_link';         // web URL
          var desktopFieldId = 'custbody_tpc_quote_to_mfiles_link_desk';     // desktop url
    
          var webUrl = rec.getValue({ fieldId: webFieldId }) || '';
          var desktopUrl = rec.getValue({ fieldId: desktopFieldId }) || '';
    
          // Build escaped JSON so JS in the page gets correct string values
          var webJson = JSON.stringify(webUrl);
          var desktopJson = JSON.stringify(desktopUrl);
            
        
          form.getField({ id: 'custbody_tpc_quote_to_mfiles_link' }).updateDisplayType({
            displayType: serverWidget.FieldDisplayType.HIDDEN
          });
          form.getField({ id: 'custbody_tpc_quote_to_mfiles_link_desk' }).updateDisplayType({
            displayType: serverWidget.FieldDisplayType.HIDDEN
          });
          

          // Create an INLINEHTML field (must start with custpage)
          var htmlFld = form.addField({
            id: 'custpage_mfiles_open_dialog',
            label: 'M-Files Link Launcher',
            type: serverWidget.FieldType.INLINEHTML,
            container: 'main'
          });

       
          
        
      htmlFld.updateBreakType({
        breakType: serverWidget.FieldBreakType.STARTCOL
      });
          
        htmlFld.updateLayoutType({
        layoutType: serverWidget.FieldLayoutType.OUTSIDEABOVE
      });
    
          // Inline HTML + JS modal. Keep it self-contained and non-invasive.
          var html = ''
            + '<style>'
            + '.tpc-mfiles-btn{display:inline-block;padding:6px 10px;background:#0070D2;color:#fff;border-radius:4px;cursor:pointer;margin:6px 0;font-size:13px;text-decoration:none;}'
            + '.tpc-mfiles-modal{position:fixed;left:0;top:0;width:100%;height:100%;background:rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;z-index:99999;}'
            + '.tpc-mfiles-card{background:#fff;padding:18px;border-radius:6px;max-width:520px;width:92%;box-shadow:0 6px 18px rgba(0,0,0,.15);font-family:Arial,Helvetica,sans-serif;}'
            + '.tpc-mfiles-row{margin-bottom:12px;}'
            + '.tpc-mfiles-link{display:inline-block;margin-right:8px;padding:8px 12px;border-radius:4px;background:#f3f3f3;color:#222;text-decoration:none;border:1px solid #ddd;}'
            + '.tpc-mfiles-close{float:right;cursor:pointer;color:#666;font-weight:700;}'
            + '.tpc-mfiles-copy{margin-left:8px;font-size:12px;color:#0070D2;cursor:pointer;text-decoration:underline;}'
            + '</style>';
    
          html += '<div id="tpc_mfiles_launcher_container" >';
          // Launcher button that opens modal
          html += '<a id="tpc_mfiles_launch_btn" class="tpc-mfiles-btn">Open in M-Files</a>';
    
          // Modal HTML (hidden by default)
          html += '<div id="tpc_mfiles_modal" class="tpc-mfiles-modal" style="display:none;">'
               +   '<div class="tpc-mfiles-card" role="dialog" aria-modal="true">'
               +     '<div><span style="font-size:16px;font-weight:600">Open in M-Files</span><span id="tpc_mfiles_close" class="tpc-mfiles-close">✕</span></div>'
               +     '<div class="tpc-mfiles-row"><small>  </small></div>'
               +     '<div class="tpc-mfiles-row">';
    
          // Web button - open in new tab
          html += '<a id="tpc_mfiles_open_web" class="tpc-mfiles-link" href="javascript:void(0);">Open in Web</a>';
    
          // Desktop button - will attempt to open m-files protocol
          html += '<a id="tpc_mfiles_open_desktop" class="tpc-mfiles-link" href="javascript:void(0);">Open in Desktop App</a>';
    
          html +=     '</div>';
    
          // Show the actual raw links with copy actions as fallback
          html += '<div class="tpc-mfiles-row"><div><strong>Web URL:</strong> <span id="tpc_web_text" style="word-break:break-all;"></span>'
               +  ' <span id="tpc_web_copy" class="tpc-mfiles-copy">Copy</span></div></div>';
    
          html += '<div class="tpc-mfiles-row"><div><strong>Desktop URL:</strong> <span id="tpc_desktop_text" style="word-break:break-all;"></span>'
               +  ' <span id="tpc_desktop_copy" class="tpc-mfiles-copy">Copy</span></div></div>';
    
          html += '<div style="text-align:right;margin-top:8px;"><a id="tpc_mfiles_modal_close" class="tpc-mfiles-link" href="javascript:void(0);">Close</a></div>';
    
          html +=   '</div></div>'; // end modal + container div
    
          // Add script — using the JSON-stringified urls above
          html += '<script type="text/javascript">';
          html += 'var _tpc_web = ' + webJson + ';';
          html += 'var _tpc_desktop = ' + desktopJson + ';';
          html += 'document.addEventListener("DOMContentLoaded", function(){'
               +  'var btn = document.getElementById("tpc_mfiles_launch_btn");'
               +  'var modal = document.getElementById("tpc_mfiles_modal");'
               +  'var close = document.getElementById("tpc_mfiles_close");'
               +  'var close2 = document.getElementById("tpc_mfiles_modal_close");'
               +  'var openWeb = document.getElementById("tpc_mfiles_open_web");'
               +  'var openDesktop = document.getElementById("tpc_mfiles_open_desktop");'
               +  'var webText = document.getElementById("tpc_web_text");'
               +  'var desktopText = document.getElementById("tpc_desktop_text");'
               +  'var webCopy = document.getElementById("tpc_web_copy");'
               +  'var desktopCopy = document.getElementById("tpc_desktop_copy");'
    
               // populate text
               +  'webText.textContent = _tpc_web || "(none)";'
               +  'desktopText.textContent = _tpc_desktop || "(none)";'
    
               // button open handlers
               +  'openWeb.addEventListener("click", function(){ if(!_tpc_web){ alert("No web link available"); return; } window.open(_tpc_web, "_blank"); });'
               +  'openDesktop.addEventListener("click", function(){ if(!_tpc_desktop){ alert("No desktop link available"); return; } '
               // Attempt to open the protocol by changing location — browsers will ask user
               +    'try{ window.location.href = _tpc_desktop; } catch(e){ alert("Could not open desktop link"); }'
               +  '});'
    
               // copy handlers (simple copy to clipboard)
               +  'webCopy.addEventListener("click", function(){ if(!_tpc_web) return; navigator.clipboard && navigator.clipboard.writeText(_tpc_web).then(function(){ alert("Web URL copied"); }, function(){ prompt("Copy this URL:", _tpc_web); }); });'
               +  'desktopCopy.addEventListener("click", function(){ if(!_tpc_desktop) return; navigator.clipboard && navigator.clipboard.writeText(_tpc_desktop).then(function(){ alert("Desktop URL copied"); }, function(){ prompt("Copy this URL:", _tpc_desktop); }); });'
    
               // open/close modal
               +  'btn && btn.addEventListener("click", function(){ modal.style.display = "flex"; });'
               +  'close && close.addEventListener("click", function(){ modal.style.display = "none"; });'
               +  'close2 && close2.addEventListener("click", function(){ modal.style.display = "none"; });'
    
               // close when clicking outside card
               +  'modal && modal.addEventListener("click", function(e){ if(e.target === modal) modal.style.display="none"; });'
    
               + '});';
          html += '</script>';
    
          // assign to field
          htmlFld.defaultValue = html;
    
        } catch (err) {
          log.error({ title: 'M-Files dialog injection error', details: err });
        }
      }

    function afterSubmit(context) {
        try {
            if (context.type !== context.UserEventType.CREATE ) return;

            const quoteId = context.newRecord.id;

            // Load full Quote record
            const rec = record.load({
                type: record.Type.ESTIMATE, // Quote = Estimate
                id: quoteId
            });

            const quoteTranId = rec.getValue({ fieldId: "tranid" });
            const entityId = rec.getValue({ fieldId: "entity" });
            const customerName = rec.getText({ fieldId: "entity" }) || "Unknown Customer";
            const entityWithId = `${customerName} - ${entityId}`;

            const opportunityId = rec.getValue({ fieldId: "opportunity" });
            let opportunityValue = "";

            if (opportunityId) {
                const oppRec = record.load({
                    type: record.Type.OPPORTUNITY,
                    id: opportunityId
                });
                const oppTranId = oppRec.getValue('tranid');
                const oppEntity = oppRec.getText('entity');
                opportunityValue = `${oppTranId} - ${oppEntity}`;
            }

            const quoteValue = `${quoteTranId} ${customerName}`;

            log.debug("Quote Values", {
                quoteId,
                quoteTranId,
                customerName,
                entityWithId,
                opportunityValue
            });

            // --- Get Token ---
            const payload = {
                Username: 'NS-MFiles',
                Password: 'CleanAirRocks!',
                VaultGuid: '{05931937-E22E-488F-BDC9-F4EE366370F4}',
                Expiration: "2027-09-30T10:36:29Z"
            };

            const tokenResponse = https.post({
                url: 'https://mfiles.cleanairproducts.com/REST/server/authenticationtokens',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const token = JSON.parse(tokenResponse.body).Value;
            log.debug("M-Files Token", token);

            // --- Build Properties for Quote ---
            let properties = [
                {
                    "PropertyDef": "PD.NSQuoteID",
                    "Value": quoteValue
                }
            ];

            if (opportunityValue) {
                properties.push({ "PropertyDef": "PD.NSOpportunity", "Value": opportunityValue });
                properties.push({ "PropertyDef": "PD.NsCompany", "Value": entityWithId });
            }

            // --- Create Quote in M-Files ---
            let quoteResponse = createInMFiles(token, "OT.NsQuote", "CL.NSQuote", properties);

            // If fails → try creating company then retry
            if (quoteResponse && quoteResponse.Error && quoteResponse.Error.HasError){

                log.debug("Quote API Failed, Creating Opportunity...." , quoteResponse.Error.ErrorMessage)

                var opportunityResponse = createInMFiles(token , "OT.NsOpportunity", "CL.NSOpportunity", [
                    { "PropertyDef": "0", "Value": opportunityValue },
                    { "PropertyDef": "PD.NsCompany", "Value": entityWithId }
                ])

                if (opportunityResponse.Error && opportunityResponse.Error.HasError) {
                    // --- Step 4: Create Company if missing ---
                    log.debug("Opportunity Failed, Creating Company...", opportunityResponse.Error.ErrorMessage);

                    var companyResponse = createInMFiles(token,"OT.NsCompany", "CL.NsCompany", [
                        { "PropertyDef": "0", "Value": entityWithId }
                    ]);

                    log.debug("Company Created", companyResponse);
                
                     opportunityResponse = createInMFiles(token , "OT.NsOpportunity", "CL.NSOpportunity", [
                        { "PropertyDef": "0", "Value": opportunityValue },
                        { "PropertyDef": "PD.NsCompany", "Value": entityWithId }
                    ])
            }

            quoteResponse = createInMFiles(token, "OT.NsQuote", "CL.NSQuote", properties);
        }

            // --- Save M-Files URL back on Quote ---
            if (quoteResponse && !quoteResponse.Error?.HasError) {
                const quoteUrl = quoteResponse.WebClientUrl;
                const quotedesktopUrl = quoteResponse.DesktopClientUrl;
                rec.setValue({
                    fieldId: 'custbody_tpc_quote_to_mfiles_link',
                    value: quoteUrl
                });
                rec.setValue({
                    fieldId: 'custbody_tpc_quote_to_mfiles_link_desk',
                    value: quotedesktopUrl
                });
                rec.save();

                log.debug("Updated NS Quote with M-Files URL", quoteUrl + "     " + quotedesktopUrl);
            } else {
                log.error("Quote creation failed", JSON.stringify(quoteResponse));
            }

        } catch (e) {
            log.error("afterSubmit Error", e.message);
        }
    }

    function createInMFiles(token, objectType, objectClass, properties) {
        const response = https.post({
            url: "https://mfiles.cleanairproducts.com/REST/vault/extensionmethod/CreateObject",
            headers: {
                "X-Authentication": token,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "APIKey": "",
                "ObjectType": objectType,
                "Class": objectClass,
                "Properties": properties
            })
        });

        log.debug(`M-Files create response (${objectType})`, response.body);
        return JSON.parse(response.body);
    }

    return { beforeLoad , afterSubmit };
});
