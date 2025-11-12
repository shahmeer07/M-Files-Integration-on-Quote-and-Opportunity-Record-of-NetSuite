/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 */
define(['N/record', 'N/search', 'N/log'], function(record, search, log) {

    function execute(context) {
        try {
            const recSearch = search.create({
                type: 'customrecord_tpc_mfiles_emails',
                filters: [],
                columns: ['internalid']
            });

            recSearch.run().each(function(result) {
                try {
                    record.delete({
                        type: 'customrecord_tpc_mfiles_emails',
                        id: result.id
                    });
                    log.audit('Deleted record', result.id);
                } catch (e) {
                    log.error('Delete failed', `ID ${result.id}: ${e.message}`);
                }
                return true; // continue to next
            });

            log.audit('Mass Delete', 'Completed deleting all Tpc M-Files Emails records.');

        } catch (err) {
            log.error('Error in mass delete script', err.message);
        }
    }

    return { execute };
});
