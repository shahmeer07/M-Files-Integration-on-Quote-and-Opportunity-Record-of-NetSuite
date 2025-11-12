/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define([
  'N/search',
  'N/ui/serverWidget',
  'N/log',
  'N/url'
], function (search, serverWidget, log,url) {

  function beforeLoad(context) {
    try {
      // Only show on view (adjust if you want edit)
      if (context.type !== context.UserEventType.VIEW) return;

      const form = context.form;
      const rec = context.newRecord;
      const recordId = rec.id
      const recType = rec.type; // e.g. 'estimate', 'opportunity', 'salesorder', 'customer'
      const recId = String(rec.id || '');

      if (!recId) return;

      // Map NetSuite record type -> customrecord field that stores the relation (verify these IDs)
      const fieldMap = {
        estimate: 'custrecord_tpc_mfiles_email_quote',
        opportunity: 'custrecord_tpc_mfiles_email_opp',
        salesorder: 'custrecord_tpc_mfiles_salesorder',
        customer: 'custrecord_tpc_mfiles_email_company'
      };

      const linkFieldId = fieldMap[recType];
      if (!linkFieldId) return; // not supported record type

      // Add tab + sublist
      const tabId = 'custpage_mfiles_emails_tab';
      const sublistId = 'custpage_mfiles_emails_sublist';

      try {
        form.addTab({ id: tabId, label: 'Email History' });
      } catch (e) {
        // ignore if tab already exists
      }

      const sublist = form.addSublist({
        id: sublistId,
        type: serverWidget.SublistType.LIST,
        label: 'M-Files Emails',
        tab: tabId
      });

      sublist.addField({ id: 'custpage_col_actions', type: serverWidget.FieldType.TEXT, label: 'Actions' });
      sublist.addField({ id: 'custpage_col_title', type: serverWidget.FieldType.TEXT, label: 'Title' });
      sublist.addField({ id: 'custpage_col_created', type: serverWidget.FieldType.DATE, label: 'Created' });
      sublist.addField({ id: "custpage_col_desktop" , type: serverWidget.FieldType.TEXT,label: "Open in M-Files"})
      sublist.addField({ id: 'custpage_col_nsquote', type: serverWidget.FieldType.TEXT, label: 'NS Quote' });
      sublist.addField({ id: 'custpage_col_nsopp', type: serverWidget.FieldType.TEXT, label: 'NS Opportunity' });
      sublist.addField({ id: 'custpage_col_nsso', type: serverWidget.FieldType.TEXT, label: 'NS Sales Order' });
      sublist.addField({ id: 'custpage_col_nscompany', type: serverWidget.FieldType.TEXT, label: 'NS Company' });
      sublist.addField({
        id: 'custpage_col_author',
        type: serverWidget.FieldType.TEXT,
        label: 'Author'
      });
      sublist.addField({
        id: 'custpage_col_recipient',
        type: serverWidget.FieldType.TEXT,
        label: 'Primary Recipient'
      });
      sublist.addField({ id: 'custpage_col_web', type: serverWidget.FieldType.TEXT, label: 'M-Files Web Link' });
      
      sublist.addField({ id: 'custpage_col_email_recid', type: serverWidget.FieldType.TEXT, label: 'Email Record ID' })
        .updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });

      // Build filters
      let filters = [];

      // Always check the record link field by internal ID
      filters.push([linkFieldId, search.Operator.ANYOF, recId]);

      // For transactions, also check tranid in a TEXT field (e.g. title)
      let tranid = null;
      if (recType !== 'customer') {
      tranid = rec.getValue({ fieldId: 'tranid' }) || null;
      }

      // If tranid exists, add OR condition to search by title (or another text field)
      if (tranid) {
      filters = [
          [linkFieldId, search.Operator.ANYOF, recId],
          'OR',
          ['custrecord_tpc_mfiles_email_title', search.Operator.CONTAINS, String(tranid)]
      ];
      }

      // Also allow recId to be matched in the title (as fallback)
      filters = [
      [linkFieldId, search.Operator.ANYOF, recId],
      'OR',
      ['custrecord_tpc_mfiles_email_title', search.Operator.CONTAINS, recId]
      ];


      const cols = [
        search.createColumn({ name: 'internalid' }),
        search.createColumn({ name: 'custrecord_tpc_mfiles_email_title' }),
        search.createColumn({ name: 'custrecord_tpc_mfiles_created_date' }),
        search.createColumn({ name: 'custrecord_tpc_mfiles_email_web_url' }),
        search.createColumn({ name: 'custrecord_tpc_mfiles_email_desktop_url' }),
        search.createColumn({ name: 'custrecord_tpc_mfiles_email_quote' }),
        search.createColumn({ name: 'custrecord_tpc_mfiles_email_opp' }),
        search.createColumn({ name: 'custrecord_tpc_mfiles_salesorder' }),
        search.createColumn({ name: 'custrecord_tpc_mfiles_email_company' })
      ];

      const q = search.create({
        type: 'customrecord_tpc_mfiles_emails',
        filters: filters,
        columns: cols
      });

      // limit UI load — adjust if needed
      const results = q.run().getRange({ start: 0, end: 1000 }) || [];

      for (let i = 0; i < results.length; i++) {
        const r = results[i];
        const title = r.getValue('custrecord_tpc_mfiles_email_title') || '';
        const created = r.getValue('custrecord_tpc_mfiles_created_date') || '';
        const webUrl = r.getValue('custrecord_tpc_mfiles_email_web_url') || '';
        const desktopUrl = r.getValue('custrecord_tpc_mfiles_email_desktop_url') || '';
        const quoteText = r.getText('custrecord_tpc_mfiles_email_quote') || r.getValue('custrecord_tpc_mfiles_email_quote') || '';
        const oppText = r.getText('custrecord_tpc_mfiles_email_opp') || r.getValue('custrecord_tpc_mfiles_email_opp') || '';
        const soText = r.getText('custrecord_tpc_mfiles_salesorder') || r.getValue('custrecord_tpc_mfiles_salesorder') || '';
        const companyText = r.getText('custrecord_tpc_mfiles_email_company') || r.getValue('custrecord_tpc_mfiles_email_company') || '';
        const emailRecId = r.getValue('internalid') || '';

        sublist.setSublistValue({ id: 'custpage_col_title', line: i, value: String(title) });
        const createdDate = created ? created.split(' ')[0] : '';
          if (createdDate) {
          sublist.setSublistValue({
              id: 'custpage_col_created',
              line: i,
              value: String(createdDate)
          });
          }
        if (webUrl) { const WebsafeUrl = webUrl.replace(/"/g, '&quot;'); // prevent any quote breakage
          
        const WebclickableHtml = `<a href="${WebsafeUrl}" target="_blank">Open Email</a>`;
        sublist.setSublistValue({
          id: 'custpage_col_web',
          line: i,
          value: WebclickableHtml
        });
      }
        if (desktopUrl) {
          
          const safeUrl = desktopUrl.replace(/"/g, '&quot;'); // prevent any quote breakage
          
          const clickableHtml = `<a href="${safeUrl}" target="_blank">Open Email</a>`;
          sublist.setSublistValue({
            id: 'custpage_col_desktop',
            line: i,
            value: clickableHtml
          });
        }
        sublist.setSublistValue({ id: 'custpage_col_nsquote', line: i, value: String(quoteText) });
        sublist.setSublistValue({ id: 'custpage_col_nsopp', line: i, value: String(oppText) });
        sublist.setSublistValue({ id: 'custpage_col_nsso', line: i, value: String(soText) });
        sublist.setSublistValue({ id: 'custpage_col_nscompany', line: i, value: String(companyText) });
        sublist.setSublistValue({ id: 'custpage_col_email_recid', line: i, value: String(emailRecId) });

        if (emailRecId) {
          const viewUrl = url.resolveRecord({
            recordType: 'customrecord_tpc_mfiles_emails',
            recordId: emailRecId,
            isEditMode: false
          });
          const editUrl = url.resolveRecord({
            recordType: 'customrecord_tpc_mfiles_emails',
            recordId: emailRecId,
            isEditMode: true
          });

          const actionHtml = `<a href="${viewUrl}" target="_blank">View</a> | <a href="${editUrl}" target="_blank">Edit</a>`;
          sublist.setSublistValue({
            id: 'custpage_col_actions',
            line: i,
            value: actionHtml
          });
        }

      }

      // Native NetSuite Emails
var messageSearchObj = search.create({
type: "message",
filters: [
  ["transaction.internalid", "anyof", recordId],
  "AND",
  ["messagetype", "anyof", "EMAIL"]
],
columns: [
  search.createColumn({ name: "subject" }), 
  search.createColumn({ name: "messagedate" }),
  search.createColumn({ name: "author" }),
  search.createColumn({ name: "recipient" }),
  search.createColumn({ name: "recipientemail"}),
  search.createColumn({ name: "cc" }),
  search.createColumn({ name: "internalid" })
]
});

// var emailResults = messageSearchObj.run().getRange({ start: 0, end: 1000 }) || [];

var rawEmailResults = messageSearchObj.run().getRange({ start: 0, end: 1000 }) || [];

let seen = new Set();
let emailResults = [];
rawEmailResults.forEach(r => {
let emailId = r.getValue({ name: 'internalid' });
if (!seen.has(emailId)) {
  seen.add(emailId);
  emailResults.push(r);
}
});

let startLine = results.length; // continue after M-Files lines
for (let j = 0; j < emailResults.length; j++) {
const er = emailResults[j];
const subj = er.getValue({ name: 'subject' }) || '';
const msgDate = er.getValue({ name: 'messagedate' }) || '';
const author = er.getText({ name: 'author' }) || '';
const recip = er.getText({ name: 'recipient' }) || er.getValue({ name: 'recipientemail' }) || '';
const cc = er.getValue({ name: 'cc' }) || '';
const emailId = er.getValue({ name: 'internalid' }) || '';

if (subj) sublist.setSublistValue({ id: 'custpage_col_title', line: startLine, value: subj });
if (msgDate) sublist.setSublistValue({ id: 'custpage_col_created', line: startLine, value: String(msgDate).split(' ')[0] });
if (author) {
  sublist.setSublistValue({ id: 'custpage_col_author', line: startLine, value: author });
}
if (recip) {
  let recips = recip;
  if (cc) recips += ` (CC: ${cc})`;
  sublist.setSublistValue({ id: 'custpage_col_recipient', line: startLine, value: recips });
}


if (emailId) {
  const viewUrl = url.resolveRecord({
    recordType: 'message',
    recordId: emailId,
    isEditMode: false
  });
  sublist.setSublistValue({
    id: 'custpage_col_actions',
    line: startLine,
    value: `<a href="${viewUrl}" target="_blank">View Email</a>`
  });
}

startLine++;
}

    } catch (e) {
      log.error({ title: 'M-Files Emails UE Error', details: e });
    }
  }

  return {
    beforeLoad: beforeLoad
  };
});
