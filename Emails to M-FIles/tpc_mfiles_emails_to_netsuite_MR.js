/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */

define (["N/https","N/record","N/runtime","N/search","N/format","N/log"],function(https,record,runtime,search,format,log){

    function getInputData(context) {
        try {
            // --- Helper to format dates as MM/DD/YYYY ---
            function formatDateForMFiles(date) {
                const month = date.getMonth() + 1;
                const day = date.getDate();
                const year = date.getFullYear();
                return `${month}/${day}/${year}`;
            }
            function formatStartOfDay(date) {
                return `${formatDateForMFiles(date)} 00:00:00`;
            }
            function formatEndOfDay(date) {
                return `${formatDateForMFiles(date)} 23:59:59`;
            }
    
            // window (adjust if you want bigger window)
            const startDateObj = new Date();
            startDateObj.setDate(startDateObj.getDate() - 3);
            const endDateObj = new Date(); // today
    
            const startDate = formatStartOfDay(startDateObj);
            const endDate = formatEndOfDay(endDateObj);
    
            // --- Get M-Files token ---
            const Tokenpayload = {
                Username: 'NS-MFiles',
                Password: 'CleanAirRocks!',
                VaultGuid: '{05931937-E22E-488F-BDC9-F4EE366370F4}',
                Expiration: "2027-09-30T10:36:29Z"
            };
    
            const tokenResponse = https.post({
                url: 'https://mfiles.cleanairproducts.com/REST/server/authenticationtokens',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(Tokenpayload)
            });
    
            const token = JSON.parse(tokenResponse.body).Value;
            log.debug("M-Files Token", token);
    
            // --- Prepare payload with pagination ---
            let allResults = [];
            let start = 0;
            const pageSize = 4000; // M-Files max per request
    
            while (true) {
                const payload = {
                    APIKey: '',
                    ObjectSearches: [
                        {
                            ReturnPropertyDefValues: ["0","20","PD.NSQuote","PD.NSOpportunity","PD.NsCompany","PD.NSSalesOrder"],
                            Filters: [
                                { PropertyDef: "100", ConditionType: "MFConditionTypeEqual", SearchValue: "CL.Email" },
                                { PropertyDef: "20", ConditionType: "MFConditionTypeGreaterThan", SearchValue: startDate },
                                { PropertyDef: "20", ConditionType: "MFConditionTypeLessThan", SearchValue: endDate }
                            ],
                            Paging: { Start: start, Limit: pageSize }
                        }
                    ]
                };
    
                const headers = {
                    "X-Authentication": token,
                    "Content-Type": "application/json"
                };
    
                const response = https.post({
                    url: 'https://mfiles.cleanairproducts.com/REST/vault/extensionmethod/SearchHelper',
                    body: JSON.stringify(payload),
                    headers: headers
                });
    
                if (response.code !== 200) {
                    log.error('M-Files API Error', response.body);
                    break;
                }
    
                const results = JSON.parse(response.body);
    
                if (!results || !results.Results || results.Results.length === 0) break;
    
                allResults = allResults.concat(results.Results);
    
                // If less than pageSize returned, we are done
                if (results.Results.length < pageSize) break;
    
                start += pageSize; // next page
            }
    
            log.debug("Total results fetched", allResults.length);
            log.debug("All results: ",allResults)
    
            return allResults;
    
        } catch (error) {
            log.error("Error in getInputData function", error.message);
            return [];
        }
    }

    function map(context) {
        try {
            const result = JSON.parse(context.value);
            
    
            const guid = result.ObjectInfo?.GUID;
            const id = result.ObjectInfo?.ID;
            const webURL = result.ObjectInfo?.WebURL;
            const desktopURL = result.ObjectInfo?.DesktopURL;
           
            const title = result.Properties?.find(p => p.PropertyDefID === "0")?.Value || " ";
            const createdDate = result.Properties?.find(p => p.PropertyDefID === "20")?.Value || null;
    
            // Normalize values: if null, empty, or "N/A" → treat as not populated
            function normalize(val) {
                if (!val) return null;
                if (val.toString().trim().toUpperCase() === "N/A") return null;
                return val;
            }

            function getProp(result, key) {
                const prop = result.Properties?.find(p => p.PropertyDefID === key);
                return prop && prop.Value ? prop.Value : null;
            }
            
            const nsQuote   = normalize(getProp(result, "PD.NSQuote"));
            const nsOpp     = normalize(getProp(result, "PD.NSOpportunity"));
            const nsCompany = normalize(getProp(result, "PD.NSCompany") || getProp(result, "PD.NsCompany")); // handle case mismatch
            const nsSO      = normalize(getProp(result, "PD.NSSalesOrder"));
            
            if( nsQuote || nsOpp ||  nsCompany || nsSO )log.debug("Extracted NS fields", { nsQuote, nsOpp, nsCompany, nsSO });
            
    
            if (!nsQuote && !nsOpp && !nsCompany && !nsSO) {
                
                return;
            }
    
            const duplicate = search.create({
                type: "customrecord_tpc_mfiles_emails",
                filters: [['custrecord_tpc_mfiles_email_guid', 'is', guid]],
                columns: ['internalid']
            }).run().getRange({ start: 0, end: 1 });
    
            if (duplicate && duplicate.length > 0) {
                return;
            }
    
            context.write({
                key: guid,
                value: {
                    guid,
                    id,
                    webURL,
                    desktopURL,
                    title,
                    createdDate,
                    nsQuote,
                    nsOpp,
                    nsCompany,
                    nsSO
                }
            });
    
        } catch (error) {
            log.error("Error in map function", error.message);
        }
    }
    

    function reduce(context){
        try {
            log.debug("Reduce stage started: ", " --------------------------------------- ")
            const data = JSON.parse(context.values[0])

            log.debug("All data in reduce stage: ",data)

            let companyId = null;
            if (data.nsCompany) {
                const match = data.nsCompany.match(/(\d+)$/); // get last number at end
                if (match) companyId = parseInt(match[0], 10);
            }

            // Quote / Opp / SO need searches
            let quoteId = null;
            let oppId   = null;
            let soId    = null;

            if (data.nsQuote) {
                const cleanQuote = cleanTranId(data.nsQuote);
                quoteId = findTransactionInternalId('estimate', cleanQuote);
                log.debug("Quote tranid cleaned", cleanQuote);
            }
            
            if (data.nsOpp) {
                const cleanOpp = cleanTranId(data.nsOpp);
                oppId = findTransactionInternalId('opportunity', cleanOpp);
                log.debug("Opportunity tranid cleaned", cleanOpp);
            }
            
            if (data.nsSO) {
                const cleanSO = cleanTranId(data.nsSO);
                soId = findTransactionInternalId('salesorder', cleanSO);
                log.debug("SalesOrder tranid cleaned", cleanSO);
            }
            

            const rec = record.create({
                type: "customrecord_tpc_mfiles_emails",
                isDynamic: true
            })



            rec.setValue({ fieldId: 'custrecord_tpc_mfiles_email_guid', value: data.guid });
            rec.setValue({ fieldId: 'custrecord_tpc_mfiles_email_id', value: data.id });
            rec.setValue({ fieldId: 'custrecord_tpc_mfiles_email_title', value: data.title });
            
            if (data.createdDate) {
                try {
                    const parsedDate = format.parse({
                        value: data.createdDate,
                        type: format.Type.DATETIME // change to DATE if your field is Date-only
                    });
                    rec.setValue({
                        fieldId: 'custrecord_tpc_mfiles_created_date',
                        value: parsedDate
                    });
                } catch (e) {
                    log.error("Date parse failed", `Value: ${data.createdDate}, Error: ${e.message}`);
                }
            }
            rec.setValue({ fieldId: 'custrecord_tpc_mfiles_email_web_url', value: data.webURL});
            rec.setValue({ fieldId: 'custrecord_tpc_mfiles_email_desktop_url', value: data.desktopURL });

            log.debug("Desktop Url value in reduce stage: ",data.desktopURL)

            // if (data.nsQuote) rec.setValue({ fieldId: 'custrecord_tpc_mfiles_email_quote', value: data.nsQuote });
            // if (data.nsOpp) rec.setValue({ fieldId: 'custrecord_tpc_mfiles_email_opp', value: data.nsOpp });
            // if (data.nsCompany) rec.setValue({ fieldId: 'custrecord_tpc_mfiles_email_company', value: data.nsCompany });
            // if (data.nsSO) rec.setValue({ fieldId: 'custrecord_tpc_mfiles_salesorder', value: data.nsSO });

            if (quoteId) rec.setValue({ fieldId: 'custrecord_tpc_mfiles_email_quote', value: quoteId });
            if (oppId) rec.setValue({ fieldId: 'custrecord_tpc_mfiles_email_opp', value: oppId });
            if (companyId) rec.setValue({ fieldId: 'custrecord_tpc_mfiles_email_company', value: companyId });
            if (soId) rec.setValue({ fieldId: 'custrecord_tpc_mfiles_salesorder', value: soId });


            rec.setValue({ fieldId: 'custrecord_tpc_mfiles_processed', value: false });

            const recId = rec.save()

            log.audit('Created Email Record', `Internal ID: ${recId} for GUID: ${data.guid}`);
            log.debug('Created Email Record', `Internal ID: ${recId} for GUID: ${data.guid}`);

        } catch(error){
            log.error("Error in reduce function",error.message)
        }
    }

    function summarize(summary) {
        log.audit('Summary', {
            usage: summary.usage,
            yields: summary.yields
        });
    
        if (summary.errors) {
            summary.errors.iterator().each(function (key, error) {
                log.error('Summary Error for key: ' + key, error);
                return true;
            });
        }
    }

    function findTransactionInternalId(tranType, tranNumber) {
        if (!tranNumber) return null;
        try {

            const searchResult = search.create({
                type: tranType,
                filters: [['tranid', 'is', tranNumber]],
                columns: ['internalid']
            }).run().getRange({ start: 0, end: 1 });

            log.debug("Search results from findTransactionInternalId function: ",searchResult)
    
            return (searchResult && searchResult.length > 0)
                ? searchResult[0].getValue('internalid')
                : null;
        } catch (e) {
            log.error(`Lookup failed for ${tranType} #${tranNumber}`, e.message);
            return null;
        }
    }

    function cleanTranId(raw) {
        if (!raw) return null;
        
        const match = raw.match(/^(QUO\d+|Q\d+|OPP\d+|SO\d+)/i);
        return match ? match[0] : raw.trim();
    }
    
    

    return {
        getInputData,
        map,
        reduce,
        summarize
    };


})