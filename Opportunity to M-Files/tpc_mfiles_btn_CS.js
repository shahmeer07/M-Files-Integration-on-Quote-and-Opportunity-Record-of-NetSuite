/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define(['N/url', 'N/record','N/currentRecord'], function (url, record,currentRecord) {
    // function sendToMFiles() {
    //     try {
    //         var recId = currentRecord.get().id;

    //     var suiteletUrl = url.resolveScript({
    //         scriptId: 'customscript_tpc_opp_mfiles_int_sl',
    //         deploymentId: 'customdeploy_tpc_opp_mfiles_int_sl',
    //         params: { recordId: recId }
    //     });

    //     window.open(suiteletUrl, '_blank'); // Or window.location.href = suiteletUrl;
    //     }
    //     catch(error){
    //         log.error("Error in Client Script M-Files Function: ",error.message)
    //     }    }
    
    // function pageInit(context){

    // }

    function fieldChanged(context) {
        try {
            if (context.fieldId === 'custbody_tpc_mfiles_links') {
                const rec = currentRecord.get();
                log.debug("Client Script Started " , "-----------------------------------------")
                // Get hidden URLs
                const webUrl = rec.getValue('custbody_mfiles_weburl');
                const desktopUrl = rec.getValue('custbody_tpc_mfiles_opp_link_desktop');

                if (!webUrl && !desktopUrl) {
                    dialog.alert({
                        title: 'M-Files',
                        message: 'No M-Files links available for this record.'
                    });
                    return;
                }

                // Ask the user which one to open
                dialog.create({
                    title: 'Open M-Files Document',
                    message: 'Choose how you want to open this M-Files document:',
                    buttons: [
                        { label: 'Web', value: 'web' },
                        { label: 'Desktop', value: 'desktop' }
                    ]
                }).then(function(result) {
                    if (result === 'web' && webUrl) {
                        window.open(webUrl, '_blank');
                    } else if (result === 'desktop' && desktopUrl) {
                        window.open(desktopUrl, '_blank');
                    } else {
                        dialog.alert({
                            title: 'Unavailable',
                            message: 'The selected link type is not available.'
                        });
                    }
                })
            }
        } catch (e) {
            console.log('Error in fieldChanged: ', e);
        }
    }

    return {
        fieldChanged: fieldChanged
    };
});
