### 📘 M-Files Integration on Quote & Opportunity Records for NetSuite
Automated M-Files Object Creation • Email Sync • Inline Launch UI
<p align="center"> <img src="https://i.imgur.com/2lF8zVq.png" width="580"> </p>
📦 Overview

### This repository contains a complete, two-part integration framework between NetSuite and M-Files, enabling:

### 1️⃣ Create and Link NetSuite Quotes & Opportunities to M-Files

✔ Automatically create corresponding M-Files objects when an Opportunity is created
✔ Store both Web URL & Desktop Client URL on the NetSuite record
✔ Show a clean UI (modal launcher) inside NetSuite with:

“Open in Web”

“Open in Desktop App”

Copy buttons

Friendly modal popup
✔ Works on Opportunity, Quote, and Sales Order records

### Uses:
📄 tpc_mfiles_btn_UE.js (User Event) 

tpc_mfiles_btn_UE

### 2️⃣ Sync Emails From M-Files → NetSuite

✔ Uses a 3-day rolling window
✔ Fetches all M-Files email objects
✔ Extracts:

Quote

Opportunity

Company

Sales Order
✔ Deduplicates using GUID
✔ Saves each email as a custom NetSuite record
✔ Links to related transactions

Uses:
📄 tpc_mfiles_emails_to_netsuite_MR.js (Map/Reduce) 

tpc_mfiles_emails_to_netsuite_MR

### 3️⃣ Display M-Files Emails Inside NetSuite Records

✔ Each Opportunity, Quote, or Sales Order displays a custom sublist
✔ Shows synced emails belonging to that record
✔ Provides a filtered list for user visibility

### Uses:
📄 tpc_emails_mfiles_sublist_forRecords_UE.js (User Event)
(Not included here but referenced)

### 🚀 Architecture
NetSuite Opportunity / Quote Created
 → UserEvent: Create + Link object in M-Files
 → Store Web + Desktop URLs

### M-Files Email Objects
 → Map/Reduce pulls recent data (last 3 days)
 → Deduplicates using GUID
 → Links to NS Transactions (Quote, Opp, SO, Company)
 → Creates custom NetSuite Email Record

### NetSuite Records
 → UserEvent injects sublist showing related M-Files Emails
 → Modal Button allows user to launch M-Files object

### 📁 Folder Structure
/M-Files-Integration-on-Quote-and-Opportunity-Record-of-NetSuite
│
├── tpc_mfiles_btn_UE.js
├── tpc_mfiles_emails_to_netsuite_MR.js
├── tpc_emails_mfiles_sublist_forRecords_UE.js   (not uploaded, but part of solution)
│
└── README.md   ← You are here

### 🧩 Solution 1: M-Files Inline Link Launcher (UE Script)

### 📄 File: tpc_mfiles_btn_UE.js 

tpc_mfiles_btn_UE

### ⭐ Key Features

Injects a polished modal UI within NetSuite record view

Hides raw fields (Web URL, Desktop URL)

Generates:

Open in M-Files Web

Open in Desktop Client

Auto-creates Opportunity object in M-Files if missing

Auto-creates Company object in M-Files if required

Writes back the link to:

custbody_tpc_mfiles_opportunity_link

custbody_tpc_mfiles_opp_link_desktop

### 🖼 Example Behavior

✔ Shows "Open in M-Files" button
✔ Clicking opens a modern popup
✔ Links copyable to clipboard
✔ Desktop client can launch using protocol handler

### 🧩 Solution 2: Automatic Email Sync From M-Files (Map/Reduce)

### 📄 File: tpc_mfiles_emails_to_netsuite_MR.js 

tpc_mfiles_emails_to_netsuite_MR

### ⭐ Key Features

Pulls 3-day rolling email window

Authenticates to M-Files using a long-term token payload

Uses the SearchHelper API with paging (4000 limit)

Extracts M-Files property values:

Quote

Opportunity

Company

Sales Order

Deduplicates using GUID

Cleans & normalizes transaction numbers (QUO12345 → 12345)

Resolves NetSuite internal IDs via searches

Inserts custom records into:

customrecord_tpc_mfiles_emails

Saves:

Title

Created date

Web URL

Desktop URL

Related NetSuite records

Marks custrecord_tpc_mfiles_processed = false for later workflows

### 🧩 Solution 3: M-Files Email Sublist on NS Records

(UserEvent File not uploaded but part of repo)

### ⭐ Features

Adds a new subtab to:

Opportunity

Quote

Sales Order

Embeds a Suitelet/IFrame showing all linked M-Files Emails

Filters by:

GUID

Related record

Improves visibility for Sales, Estimating, and Operations teams

### Email Sync

✔ Run Map/Reduce
✔ Emails appear in customrecord_tpc_mfiles_emails
✔ Quote / Opp / SO IDs correctly resolved
✔ Desktop & Web links open successfully

### Sublist on Records

✔ Emails display on Opportunity/Quote/SO
✔ Links open in new tab
✔ Correct filtering by record

### 📄 Author

Shahmeer Khan
