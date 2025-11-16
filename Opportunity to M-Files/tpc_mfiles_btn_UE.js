/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/https', 'N/log', 'N/record',"N/ui/serverWidget"], function (https, log, record,serverWidget) {
    function beforeLoad(context) {
        try {
          if (context.type !== context.UserEventType.VIEW) return;
    
          var form = context.form;
          var rec = context.newRecord;
    
          // Adjust these to your actual field IDs
          var webFieldId = 'custbody_tpc_mfiles_opportunity_link';         // web URL
          var desktopFieldId = 'custbody_tpc_mfiles_opp_link_desktop';     // desktop url
    
          var webUrl = rec.getValue({ fieldId: webFieldId }) || '';
          var desktopUrl = rec.getValue({ fieldId: desktopFieldId }) || '';
    
          // Build escaped JSON so JS in the page gets correct string values
          var webJson = JSON.stringify(webUrl);
          var desktopJson = JSON.stringify(desktopUrl);
            
        
          form.getField({ id: 'custbody_tpc_mfiles_opportunity_link' }).updateDisplayType({
            displayType: serverWidget.FieldDisplayType.HIDDEN
          });
          form.getField({ id: 'custbody_tpc_mfiles_opp_link_desktop' }).updateDisplayType({
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
    
          html += '<div id="tpc_mfiles_launcher_container">';
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
            if (context.type !== context.UserEventType.CREATE) return;

            const recId = context.newRecord.id;
            const recType = context.newRecord.type;

            // Only run for Opportunity  
            if (recType !== record.Type.OPPORTUNITY) return;

            log.debug("AfterSubmit Triggered", `Type: ${recType}, ID: ${recId}`);

            // Loading full record
            let fullRec = record.load({
                type: recType,
                id: recId
            });

            // M-Files link field
            let linkField = 'custbody_tpc_mfiles_opportunity_link';
            let existingLink = fullRec.getValue({ fieldId: linkField });
            if (existingLink && existingLink.trim() !== '') {
                log.debug("Already linked to M-Files", existingLink);
                return;
            }

            // Collect values
            const tranId = fullRec.getValue({ fieldId: 'tranid' });
            const entityId = fullRec.getValue({ fieldId: 'entity' });
            const entityName = fullRec.getText({ fieldId: 'entity' }) || 'Unknown Company';
            const entityWithId = `${entityName} - ${entityId}`;
            const objectValue = `${tranId} ${entityName}`;

            log.debug("Record Values", { tranId, entityName, entityWithId, objectValue });

            //  Authenticate to M-Files 
            let payload = { 
                Username: '',
                Password: '',
                VaultGuid: '',
                Expiration: ""
            };

            let tokenResponse = https.post({
                url: '',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            let token = JSON.parse(tokenResponse.body).Value;
            log.debug("M-Files Token", token);

            // === Create Opportunity in M-Files ===
            let createResponse = createInMFiles(token, "OT.NsOpportunity", "CL.NSOpportunity", [
                { "PropertyDef": "0", "Value": objectValue },
                { "PropertyDef": "PD.NsCompany", "Value": entityWithId }
            ]);

            // If fails → create company first then retry
            if (createResponse.Error && createResponse.Error.HasError) {
                log.debug("Creation failed, creating company", createResponse.Error.ErrorMessage);

                createInMFiles(token, "OT.NsCompany", "CL.NsCompany", [
                    { "PropertyDef": "0", "Value": entityWithId }
                ]);

                createResponse = createInMFiles(token, "OT.NsOpportunity", "CL.NSOpportunity", [
                    { "PropertyDef": "0", "Value": objectValue },
                { "PropertyDef": "PD.NsCompany", "Value": entityWithId }
                ]);
            }

            if (createResponse && !createResponse.Error?.HasError) {
                let mfilesUrl = createResponse.WebClientUrl;
                let mfilesDesktopUrl = createResponse.DesktopClientUrl;

                fullRec.setValue({
                    fieldId: linkField,
                    value: mfilesUrl
                });
                fullRec.setValue({
                    fieldId: 'custbody_tpc_mfiles_opp_link_desktop',
                    value: mfilesDesktopUrl
                })

                fullRec.save();

                log.debug("Updated Opportunity with M-Files Links", {
                    Web: mfilesUrl,
                    Desktop: mfilesDesktopUrl
                });
            } else {
                log.error("M-Files creation failed", JSON.stringify(createResponse));
            }

        } catch (e) {
            log.error("afterSubmit Error", e.message);
        }
    }

    function createInMFiles(token, objectType, objectClass, properties) {
        let response = https.post({
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

    return {  beforeLoad , afterSubmit };
});
