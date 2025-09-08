/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */

define (['N/ui/serverWidget','N/runtime'] , function (serverWidget,runtime){
    function beforeLoad(context){
        try {
            if(context.type !== context.UserEventType.VIEW ) return 

        var form = context.form
        var record = context.newRecord

        form.clientScriptModulePath = 'SuiteScripts/TPC/M-Files Integration/tpc_mfiles_btn_CS.js'

        form.addButton({
            id: "custpage_send_to_mfiles",
            label: "Opportunity to M-Files",
            functionName: 'sendToMFiles'
        })
        } catch(error){
            log.error("Error in beforeLoad function: ",error.message)
        }
    }
    return {
        beforeLoad : beforeLoad
    }
})