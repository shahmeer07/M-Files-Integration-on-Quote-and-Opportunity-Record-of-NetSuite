/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define(['N/url', 'N/record','N/currentRecord'], function (url, record,currentRecord) {
    function sendToMFiles() {
        try {
            var recId = currentRecord.get().id;

        var suiteletUrl = url.resolveScript({
            scriptId: 'customscript_tpc_opp_mfiles_int_sl',
            deploymentId: 'customdeploy_tpc_opp_mfiles_int_sl',
            params: { recordId: recId }
        });

        window.open(suiteletUrl, '_blank'); // Or window.location.href = suiteletUrl;
        }
        catch(error){
            log.error("Error in Client Script M-Files Function: ",error.message)
        }    }
    
    function pageInit(context){

    }

    return { sendToMFiles,pageInit };
});
