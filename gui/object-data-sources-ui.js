(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./source-model'),require('./source-types'));else root.ObjectDataSourcesUI=factory(root.SourceModel,root.SourceTypes);})(typeof globalThis!=='undefined'?globalThis:this,function(Model,Types){
  'use strict';
  let clipboard=null;
  const recentCharacters=[];
  const sourceIconPaths={embedded:'M3 2h10v12H3zM5 5h6M5 8h6M5 11h4',clock:'M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1M8 4v4l3 2',database:'M2 4c0-3 12-3 12 0s-12 3-12 0v8c0 3 12 3 12 0V4M2 8c0 3 12 3 12 0',library:'M2 3h5l1 1 1-1h5v11H9l-1-1-1 1H2zM8 4v9M4 6h2M10 6h2',global:'M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1M1 8h14M8 1c-4 4-4 10 0 14M8 1c4 4 4 10 0 14',object:'M2 2h12v12H2zM4 4v5M6 4v5M9 4v5M12 4v5M4 12h8',job:'M3 5V1h10v4M3 12H1V5h14v7h-2M3 9h10v6H3zM11 7h1',file:'M1 4h5l2 2h7v8H1zM2 4V2h5l2 2h5v2',vbscript:'M5 3 1 8l4 5M11 3l4 5-4 5M9 1 7 15',pct:'M2 2h12M8 2v12M5 14h6',table:'M1 2h14v12H1zM1 6h14M1 10h14M6 2v12M10 2v12',named:'M6 5 8 3a3 3 0 0 1 4 4l-2 2M10 11l-2 2a3 3 0 0 1-4-4l2-2M5 11l6-6'};
  // Native Description catalog (396 entries): see docs/bartender-description-terms-2026-10-20.md.
  const descriptionTerms=Object.freeze([
    "Active Potency",
    "Actual Length",
    "Additional item identification",
    "Additional Product Identification Assigned by the Manufacturer",
    "Additional Purchase Rules Code",
    "Address of person",
    "Address Validation",
    "AI Code",
    "AIDC Media Type",
    "AIM Defined Sensor Instruction Parameters",
    "Amount",
    "Amount Payable",
    "Amount Payable and ISO Currency Code",
    "Amount Payable for a Variable Measure Trade Item (Single Monetary Area)",
    "Amount Payable for a Variable Measure Trade Item and ISO Currency Code",
    "Amount Payable or Coupon Value (Single Monetary Area)",
    "Amount Payable per Unit of Measure Single Monetary Area",
    "Area",
    "Area (Square Feet)",
    "Area (Square Feet) (Logistics)",
    "Area (Square Inches)",
    "Area (Square Inches)(Logistics)",
    "Area (Square Meters)",
    "Area (Square Meters)(Logistics)",
    "Area (Square Yards)",
    "Area (Square Yards)(Logistics)",
    "Assigning Country",
    "Authority To Leave Flag",
    "Auto",
    "Baby birth sequence indicator",
    "Baby of family name",
    "Barcode Identifier",
    "Batch or Lot Number",
    "Batch/Lot",
    "Best Before Date",
    "Best Before Date (YYMMDD)",
    "Bill to - Invoice to Global Location Number (GLN)",
    "Biological sex",
    "Brand Owner Authorised URL",
    "Catch Area",
    "Cellular Mobile Telephone Identifier",
    "Certification Reference",
    "Certification Scheme",
    "Class",
    "Class of Service",
    "Company Internal Information",
    "Component ID",
    "Component/Part Identifier (CPID)",
    "Component/Part Identifier Serial Number",
    "Composite Data",
    "Consumer Product Variant",
    "Core Diameter",
    "Count of items",
    "Count of Trade Items or Trade Item Pieces contained in a Logistic Unit",
    "Country Code, Number of Processor",
    "Country Covering Full Process Chain (3-Digit ISO Country Code)",
    "Country of Disassembly (one or more 3-Digit ISO Country Codes)",
    "Country of Initial Processing (one or more 3-Digit ISO Country Codes)",
    "Country of Origin of a Trade Item (3-Digit ISO Country Code)",
    "Country of Processing (3-Digit ISO Country Code)",
    "Country Subdivision of Origin Code for a Trade Item",
    "Coupon Code Identification for Use in North America",
    "Coupon Reference",
    "Cover Price",
    "Currency",
    "Custom Data Source",
    "Customer Identifier",
    "Customer Part No.",
    "Customer Part Number",
    "Customer's Purchase Order Number",
    "Dangerous Goods Flag",
    "Data",
    "Data Field",
    "Data Length Specifier",
    "Data Terminator",
    "Date",
    "Date and time of birth",
    "Date and Time of Production",
    "Date of birth",
    "Day of Pickup",
    "Decimal Point Position Specifier",
    "Decimal Position",
    "Decimal Position (Set in Data Source)",
    "Delivery Date",
    "Delivery Point ZIP Code",
    "Delivery Time",
    "Delivery Time Not Specified",
    "Depth, Thickness, Height or 3rd Dimension (Feet)",
    "Depth, Thickness, Height or 3rd Dimension (Feet)(Logistics)",
    "Depth, Thickness, Height or 3rd Dimension (Inches)",
    "Depth, Thickness, Height or 3rd Dimension (Inches)(Logistics)",
    "Depth, Thickness, Height or 3rd Dimension (Meters)",
    "Depth, Thickness, Height or 3rd Dimension (Meters)(Logistics)",
    "Depth, Thickness, Height or 3rd Dimension (Yards)",
    "Depth, Thickness, Height or 3rd Dimension (Yards)(Logistics)",
    "Digital Signature (DigSig)",
    "Digits for Latitude Conversion",
    "Digits for Longitude Conversion",
    "Dimensions",
    "Document Type",
    "Don't Multiply Flag",
    "Due Date",
    "Due Date for Amount on Payment Slip (YYMMDD)",
    "EAN/UCC-13",
    "EAN/UCC-8",
    "Enter Data",
    "Expiration Date",
    "Expiration Date (YYMMDD)",
    "Expiration Date and Time",
    "Expiration Time",
    "Extended Packaging URL",
    "Extension 1",
    "Extension Digit",
    "Extension Digit, GS1 Company Prefix, Serial Number",
    "Family name of person",
    "First Freeze Date",
    "Fishing Gear Type",
    "For US Companies a leading, filler \"0\" must be added to the beginning of your GS1 Company Prefix. This assures that the wizard will be able to correctly adjust the length of the serial number.",
    "Format",
    "Full name of person",
    "Functional Status",
    "GCN",
    "GDTI",
    "Given name of person",
    "GLN",
    "GLN Extension Component",
    "GLN of the Production or Service Location",
    "Global Coupon Number (GCN)",
    "Global Document Type Identifier (GDTI)",
    "Global Identification Number for Consignment (GINC)",
    "Global Individual Asset Identifier (GIAI)",
    "Global Individual Asset Identifier of an Assembly",
    "Global Location Number (GLN)",
    "Global Location Number of the Invoicing Party",
    "Global Model Number (GMN)",
    "Global Returnable Asset Identifier (GRAI)",
    "Global Service Relation Number",
    "Global Service Relation Number (GSRN) - Provider",
    "Global Service Relation Number (GSRN) - Recipient",
    "Global Shipment Identification Number (GSIN)",
    "Global Trade Item Number (GTIN)",
    "GRAI",
    "GS1 Application Identifier",
    "GS1 Application Identifier Data Source Wizard",
    "GS1 Company Prefix",
    "GS1 Company Prefix, Asset Type",
    "GS1 Company Prefix, Coupon Reference, Check Digit",
    "GS1 Company Prefix, Document Type, Check Digit",
    "GS1 Composite Data Source Wizard",
    "GS1 DataBar (RSS)",
    "GS1 DataBar (RSS)",
    "GS1 DataBar Data Source Wizard",
    "GS1 UIC",
    "GS1 UIC with Extension 1 and Importer Index",
    "GSRN",
    "GTIN",
    "GTIN-12, GTIN-13, or GTIN-14",
    "Harvest Date",
    "Harvest End Date",
    "Harvest Start Date",
    "Height",
    "Highly Individualised Device Registration Identifier (HIDRI)",
    "Identification of a Logistic Unit (SSCC)",
    "Identification of a Made-to-Order (MtO) trade item (GTIN)",
    "Identification of a Made-to-Order (MtO) trade item (GTIN)",
    "Identification of a Physical Location - Global Location Number (GLN)",
    "Identification of a Trade Item (GTIN)",
    "Identification of an Individual Trade Item Piece",
    "Identification of Pieces of a Trade Item (ITIP) contained in a Logistic Unit",
    "Identification of Trade Items contained in a Logistic Unit (GTIN)",
    "Importer index",
    "Information Mutually Agreed Between Trading Partners",
    "Internal",
    "Internal Product Variant",
    "International Bank Account Number",
    "International Bank Account Number (IBAN)",
    "ISO Country Code",
    "ISO Country Code(s)",
    "ISO Country Subdivision Code",
    "ISO Currency Code",
    "Item ID",
    "Julian Day of Pickup",
    "Kg/m²",
    "Kilograms Per Square Meter",
    "Length",
    "Length or 1st Dimension (Feet)",
    "Length or 1st Dimension (Feet)(Logistics)",
    "Length or 1st Dimension (Inches)",
    "Length or 1st Dimension (Inches)(Logistics)",
    "Length or 1st Dimension (Meters)",
    "Length or 1st Dimension (Meters)(Logistics)",
    "Length or 1st Dimension (Yards)",
    "Length or 1st Dimension (Yards)(Logistics)",
    "Logistic Volume",
    "Logistic Volume (Cubic Feet)",
    "Logistic Volume (Cubic Inches)",
    "Logistic Volume (Cubic Meters)",
    "Logistic Volume (Cubic Yards)",
    "Logistic Volume (Gallons)",
    "Logistic Volume (Liters)",
    "Logistic Volume (Quarts)",
    "Logistic Weight",
    "Logistic Weight (Kilograms)",
    "Logistic Weight (Pounds)",
    "Lot Number",
    "Lot Number (Transition Use)",
    "Loyalty Points of a Coupon",
    "Made-to-Order Variation Number",
    "Maximum temperature in Celsius",
    "Maximum temperature in Fahrenheit",
    "Minimum temperature in Celsius",
    "Minimum temperature in Fahrenheit",
    "Miscellaneous Section",
    "Msg Header",
    "MTO GTIN",
    "Name suffix of person",
    "National Healthcare Reimbursement Number (NHRN) – Brasil ANVISA",
    "National Healthcare Reimbursement Number (NHRN) – France CIP",
    "National Healthcare Reimbursement Number (NHRN) – Germany IFA",
    "National Healthcare Reimbursement Number (NHRN) – Italy AIFA",
    "National Healthcare Reimbursement Number (NHRN) – Portugal INFARMED",
    "National Healthcare Reimbursement Number (NHRN) – Spain National Code",
    "National Healthcare Reimbursement Number (NHRN) – United States FDA",
    "NATO Stock Number",
    "NATO Stock Number (NSN)",
    "NATO Supply Classification",
    "Net Volume",
    "Net Volume (Cubic Feet)",
    "Net Volume (Cubic Inches)",
    "Net Volume (Cubic Meters)",
    "Net Volume (Cubic Yards)",
    "Net Volume (Gallons)",
    "Net Volume (Liters)",
    "Net Volume (Quarts)",
    "Net Weight",
    "Net Weight (Kilograms)",
    "Net Weight (Pounds)",
    "Net Weight (Troy Ounces)",
    "Net Weight or Volume (Ounces)",
    "New Data Source Wizard",
    "NHRN - Brasil ANVISA",
    "NHRN - France CIP",
    "NHRN - Germany IFA",
    "NHRN - Italy AIFA",
    "NHRN - Portugal INFARMED",
    "NHRN - Spain National Code",
    "NHRN - United States FDA",
    "Not After Delivery Date/Time",
    "Not Before Delivery Date/Time",
    "Number of Processor",
    "Number of processor with three-digit ISO country code",
    "Number of Splices",
    "Offer Code",
    "Optically Readable Sensor Indicator",
    "Package",
    "Package In Shipment",
    "Package Weight (lb.)",
    "Packaging Component Number",
    "Packaging Component Number",
    "Packaging Date",
    "Packaging Date (YYMMDD)",
    "Party GLN",
    "Payment Slip Reference Number",
    "Percentage Discount of a Coupon",
    "Piece Number",
    "Positive offer file coupon code identification for use in North America",
    "Post Code and DPS",
    "Postal Code",
    "Price Per Unit of Measure",
    "Primary GS1 Company Prefix",
    "Primary Purchase Family Code",
    "Primary Purchase Requirement",
    "Primary Purchase Requirement Code",
    "PRO Number",
    "Product Certification",
    "Production Date",
    "Production Date (YYMMDD)",
    "Production Method",
    "Production Time",
    "Protocol ID",
    "Purchased from Global Location Number",
    "Reference Number",
    "Reference To Source",
    "Reference to Source Entity",
    "Refurbishment Lot ID",
    "Release Date",
    "Retailer GS1 Company Prefix or GLN",
    "Return-to Address Line 1",
    "Return-to Address Line 2",
    "Return-to Company Name",
    "Return-to Contact Name",
    "Return-to Country Code",
    "Return-to Locality",
    "Return-to Postal Code",
    "Return-to Region",
    "Return-to Suburb",
    "Return-to Telephone Number",
    "Revision Status",
    "Roll Products - Width, Length, Core Diameter, Direction and Splices",
    "Roll Products - Width, Length, Core Diameter, Direction, Splices",
    "Routing Code",
    "Save Value",
    "Save Value Applies To Which Item",
    "Save Value Code",
    "SCAC",
    "SCAC/PRO Format",
    "Second Purchase Family Code",
    "Second Purchase GS1 Company Prefix",
    "Second Purchase Requirement",
    "Second Purchase Requirement Code",
    "Second Qualifying Purchase",
    "Secondary Serial Number",
    "Sell By Date",
    "Sell By Date (YYMMDD)",
    "Sencond Qualifying Purchase Field Present Indicator",
    "Separator",
    "Sequence Number",
    "Sequence of birth",
    "Sequence Seperator",
    "Serial Component",
    "Serial Number",
    "Serial Number (Optional)",
    "Serial Shipping Container Code (SSCC)",
    "Service Code Description",
    "Service Relation Instance Number (SRIN)",
    "Service Type Identifier",
    "Ship for - Deliver for - Forward to Global Location Number",
    "Ship to - Deliver to Global Location Number (GLN)",
    "Ship To Address",
    "Ship To City",
    "Ship To ISO Country Code",
    "Ship To State",
    "Shipment ID",
    "Shipment ID Number",
    "Shipper Number",
    "Ship-to/Deliver-to Address Line 1",
    "Ship-to/Deliver-to Address Line 2",
    "Ship-to/Deliver-to Company Name",
    "Ship-to/Deliver-to Contact Name",
    "Ship-to/Deliver-to Country Code",
    "Ship-to/Deliver-to GEO Location",
    "Ship-to/Deliver-to GEO Location",
    "Ship-to/Deliver-to Locality",
    "Ship-to/Deliver-to Postal Code With 3-Digit ISO Country Code",
    "Ship-to/Deliver-to Postal Code Within a Single Postal Authority",
    "Ship-to/Deliver-to Region",
    "Ship-to/Deliver-to Suburb",
    "Ship-to/Deliver-to Telephone Number",
    "Signature Required Flag",
    "Slit Width",
    "Software Version",
    "Space",
    "Species For Fishery Purposes",
    "SRIN",
    "Start Date",
    "Store Coupon Flag",
    "Supply Chain ID",
    "Test by Date",
    "Test by Date",
    "Test by Time",
    "Third Party Controlled, Serialised Extension of GTIN (TPX)",
    "Third Purchase Family Code",
    "Third Purchase GS1 Company Prefix",
    "Third Purchase Requirement",
    "Third Purchase Requirement Code",
    "Third Qualifying Purchase",
    "Third Qualifying Purchase Field Present Indicator",
    "Time of birth",
    "Total Count",
    "Total number of series",
    "Tracking Number",
    "UCC-12",
    "UN/CEFACT freight unit type",
    "UNECE Meat Carcasses and Cuts Classification",
    "UNECE Product Classification",
    "Units",
    "UPC-E (6 Digits)",
    "UPS Shipper Number",
    "Value",
    "Variable Count of Items",
    "Variant",
    "Version Control Number",
    "Version ID",
    "Volume",
    "Weight",
    "Width",
    "Width, Diameter or 2nd Dimension (Feet)(Logistics)",
    "Width, Diameter or 2nd Dimension (Inches)(Logistics)",
    "Width, Diameter or 2nd Dimension (Meters)",
    "Width, Diameter or 2nd Dimension (Meters)(Logistics)",
    "Width, Diameter or 2nd Dimension (Yards)(Logistics)",
    "Width, Diameter, or 2nd Dimension (Feet)",
    "Width, Diameter, or 2nd Dimension (Inches)",
    "Width, Diameter, or 2nd Dimension (Yards)",
    "Winding Direction",
    "Year"
  ]);
  const sourceKinds=[['embedded','Embedded Data'],['clock','Clock'],['database','Database Field'],['library','Library Phrase'],['global','Global Data Field'],['object','Object Value'],['job','Print Job Field'],['file','External File'],['vbscript','Visual Basic Script'],['pct','Printer Code Template Field'],['table','Table Data Field'],['named','Link to an Existing Named Data Source']];
  const transformNames=[['suppression','Suppression'],['filter','Character Filter'],['compression','Compression'],['offset','Offset'],['range','Range Checking'],['truncation','Truncation'],['length','Number of Characters'],['character-template','Character Template'],['search-replace','Search and Replace'],['vbscript','VB Script'],['serialization','Serialization'],['prefix-suffix','Prefix and Suffix']];
  // Installed native capability branches + resource labels; display follows the native ID loop.
  const transformMenus={
    text:['suppression','filter','truncation','length','search-replace','vbscript','serialization','character-template','prefix-suffix'],
    date:['suppression','offset','range','vbscript','prefix-suffix'],
    time:['suppression','offset','vbscript','prefix-suffix'],
    number:['suppression','offset','range','serialization','prefix-suffix'],
    currency:['suppression','offset','range','prefix-suffix'],
    percentage:['suppression','offset','range','prefix-suffix'],
    fraction:['suppression','offset','range','prefix-suffix'],
    binary:['suppression','compression','vbscript','prefix-suffix'],
    picture:['suppression','compression','vbscript','prefix-suffix']
  };
  function visibleTransforms(source){
    const order=source.kind==='job'?['suppression']:transformMenus[source.dataType?.kind||'text'];
    if(!order)return transformNames;
    return [...order.map(kind=>transformNames.find(row=>row[0]===kind)),...transformNames.filter(([kind])=>!order.includes(kind)&&(source.transforms||[]).some(config=>config.kind===kind))];
  }
  const sourceFields={embedded:[['value','Embedded Data','textarea']],clock:[['printerClock',"Use Printer’s Clock",'checkbox'],['fallback','When Printer Clock Is Unavailable','select',[['abort','Always Abort Print Job'],['windows','Use Windows Clock'],['omit','Do Not Print Data Source']]]],database:[['field','Field Name'],['sampleData','Sample Data'],['defaultValue','Default Reply']],library:[['library','Library'],['phrase','Phrase ID'],['language','Language']],global:[['key','Field Name']],object:[['objectId','Object Name','object'],['value','Value','select',[['main','Main Data Source'],['human-readable','Human Readable Text']]]],job:[['key','Field','select',['page','total','copies','printer','file','jobId','document','application','version','date']]],file:[['pathMode','File Name Source','select',[['literal','Specify File Name'],['database','Get File Name from Database Field'],['named','Get File Name from Named Data Source']]],['path','File Name'],['pathSource','Field / Named Source'],['defaultPath','Default Path'],['encoding','Encoding','select',['utf-8','utf-16le','utf-16be','windows-1252','binary']]],vbscript:[['code','Script','textarea'],['event','Event','select',['OnAutoSelectedEvent','OnProcessData','OnPrintJobStart','OnSerialize']]],pct:[['field','Field Name'],['sampleData','Sample Data']],table:[['column','Field Name'],['row','Record','select',[['auto','Current Record']]]],named:[['definitionId','Named Data Source','named']]};
  const transformFields={suppression:[['when','Suppress','select',['always','empty','previous-empty','next-empty','equals']],['source','Named Source'],['value','Value']],filter:[['mode','Allowed Characters','select',[['all','All'],['digits','Numeric Only'],['currency','Currency Only'],['hex','Hexadecimal Only'],['ascii-letters','Letters (A–Z)'],['ascii-alphanumeric','Letters and Digits (A–Z, 0–9)'],['iso646','ISO 646 Invariant'],['custom','Custom'],['letters','Unicode Letters'],['alphanumeric','Unicode Letters and Digits']]],['characters','Characters'],['removeInvalid','Remove Invalid Characters','checkbox'],['case','Case','select',['none','upper','lower']]],compression:[['method','Method','select',['deflate','gzip']]],offset:[['offsetSource','Offset Source','select',[['constant','Constant'],['database','Database Field'],['named','Named Data Source'],['pct','Printer Code Template Field']]],['amount','Offset','number'],['source','Field / Named Source'],['unit','Units','select',['days','weeks','months','years','hours','minutes','seconds']]],range:[['minimum','Minimum'],['maximum','Maximum']],truncation:[['trim','Remove Leading and Trailing Spaces','checkbox'],['start','Characters to Remove from Start','number'],['length','Number of Characters to Keep','number']],length:[['minimum','Minimum Number of Characters','number'],['maximum','Maximum Number of Characters','number'],['pad','Pad Character'],['padSide','Pad On','select',['left','right']],['truncate','Truncate Excess Characters','checkbox']], 'character-template':[['pattern','Template']],vbscript:[['code','Script','textarea']],serialization:[['start','Start (blank uses source data)'],['method','Method','select',['auto','numeric','alphabetic','alphanumeric','hex','custom']],['letters','Letters','select',['upper','lower']],['excludeConfusing','Exclude Confusing Letters','checkbox'],['sequence','Custom Sequence'],['step','Increment'],['digits','Minimum Digits','number'],['scope','Increment Per','select',['copy','record','job']],['interval','Interval','number'],['trackInterval','Carry Remaining Interval Between Jobs','checkbox'],['rollover','Rollover Value'],['resetValue','Reset Value']], 'prefix-suffix':[['prefix','Prefix','textarea'],['suffix','Suffix','textarea']]};
  const defaults={suppression:{when:'always'},filter:{mode:'all',removeInvalid:true},compression:{method:'deflate'},offset:{offsetSource:'constant',amount:0,unit:'days'},range:{},truncation:{},length:{minimum:0},'character-template':{pattern:'%'},'search-replace':{actions:[]},vbscript:{code:'Value = Value'},serialization:{method:'auto',step:1,digits:0,scope:'copy',interval:1,trackInterval:true},'prefix-suffix':{prefix:'',suffix:''}};
  function mount(container,{session,objectId,onChange=()=>{},onDiagnostic=()=>{},chooseFile,chooseDirectory,inspectLibrary,openGs1,compileGs1,testTransform,treeHost,state={}}){
    const document=container.ownerDocument;let selected=state.selected||0,tab=state.tab||'Data Source',disposed=false;const ownedDialogs=new Set(),ownedMenus=new Set();
    const el=(tag,text)=>{const node=document.createElement(tag);if(tag==='button')node.dataset.qActionStyled='native';if(text!=null)node.textContent=text;return node;};
    const snapshot=()=>session.draft,object=doc=>Model.elements(doc).find(e=>e.id===objectId),refs=()=>object(snapshot()).dataSourceRefs||[];
    const selectedId=()=>refs()[selected],definition=()=>snapshot().sourceDefinitions[selectedId()];
    const availableKinds=currentKind=>sourceKinds.filter(([kind])=>kind!=='named'||currentKind==='named'||Object.values(snapshot().sourceDefinitions).some(source=>source.name));
    const root=el('section');root.className='object-source-editor';container.append(root);
    if(treeHost){treeHost.classList.add('ose-tree-host');root.classList.add('ose-reference-page');}
    if(!document.getElementById('ose-tree-reference-style')){const style=el('style');style.id='ose-tree-reference-style';style.textContent='#objectProperties nav.ose-tree-host{display:flex;flex-direction:column;padding:4px;background:#fff;border:1px solid #999}#objectProperties .ose-source-tree .ose-list button{min-height:18px;padding:0 1px;margin:0;border:0;border-radius:0;font:12px Arial;gap:2px;color:#111}#objectProperties .ose-source-tree .ose-list button[aria-selected=true]{background:#0078d7!important;color:white!important}#objectProperties .ose-source-tree .ose-list button svg{width:15px;height:16px;flex:0 0 15px;fill:#1839a4;stroke:white;stroke-width:.7}#objectProperties .ose-source-tree .ose-toolbar button{box-sizing:border-box;display:inline-flex;justify-content:center;align-items:center;width:19px;height:22px;min-height:22px;padding:1px!important;margin:0;border:0;border-radius:0;flex:0 0 19px;background:#f0f0f0}#objectProperties .ose-source-tree .ose-toolbar button:disabled{color:#aaa}#objectProperties .ose-source-tree .ose-toolbar button svg{width:16px;height:16px;flex:0 0 16px}.ose-reference-page{background:#f8f8f8;gap:0;padding:0;font:12px Arial}.ose-reference-page .ose-tabs{gap:0;padding:0;border-bottom:1px solid #ddd}.ose-reference-page .ose-tabs button{padding:3px 6px!important;border-radius:0!important;font:12px Arial!important}.ose-reference-page .ose-tabs [aria-selected=true]{background:#fff!important;color:#111!important}.ose-reference-page .ose-fields label{margin:9px 0;grid-template-columns:82px minmax(0,1fr)!important;font:12px Arial}.ose-reference-page .ose-fields input,.ose-reference-page .ose-fields select,.ose-reference-page .ose-fields textarea{padding:2px!important;font:12px Arial!important;border-radius:0!important;border-color:#aaa!important;background:#fff!important;color:#111!important}.ose-reference-page .ose-fields textarea[name="source.value"]{min-height:190px;resize:vertical}';document.head.append(style);}
    if(!document.getElementById('object-source-editor-style')){const style=el('style');style.id='object-source-editor-style';style.textContent='.object-source-editor{display:grid;grid-template-columns:minmax(110px,155px) minmax(0,1fr);gap:12px;min-height:280px}.ose-list{border:1px solid var(--border,#ccd5df);min-height:150px;max-height:230px;overflow:auto}.ose-list button{display:block;width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:left}.ose-list [aria-selected=true]{background:#dcfce7!important;color:#166534!important}.ose-toolbar{display:flex;gap:3px;flex-wrap:wrap;padding-top:6px}.ose-toolbar button{padding:5px!important;width:27px;height:29px}.ose-toolbar svg{width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:1.7}.ose-tabs{display:flex;gap:3px;border-bottom:1px solid var(--border,#ccd5df);padding-bottom:6px}.ose-tabs [aria-selected=true]{background:#dcfce7!important}.ose-fields label{grid-template-columns:minmax(90px,125px) minmax(0,1fr)!important;font-size:12px}.ose-fields textarea{min-height:90px;resize:vertical}.ose-fields input[type=checkbox]{width:auto!important}.ose-transform{display:flex;align-items:center;gap:7px;padding:6px;border-bottom:1px solid #edf0f4}.ose-transform button{margin-left:auto}.ose-transform input{width:auto!important}.ose-transform-config{padding:5px 9px;background:#f6f9f7}.ose-actions{display:flex;gap:4px;flex-wrap:wrap}.ose-note{font-size:12px;color:#64748b}.ose-error{color:#b42318;white-space:pre-wrap;font-size:12px}@media(max-width:650px){.object-source-editor{grid-template-columns:1fr}.ose-list{max-height:100px}.ose-fields label{grid-template-columns:1fr!important}}';document.head.append(style);}
    const left=el('aside'),list=el('div'),toolbar=el('div'),right=el('div'),tabs=el('div'),fields=el('div'),error=el('p');list.className='ose-list';list.tabIndex=0;list.setAttribute('role','listbox');list.setAttribute('aria-label','Object Data Sources');toolbar.className='ose-toolbar';tabs.className='ose-tabs';tabs.setAttribute('role','tablist');fields.className='ose-fields';error.className='ose-error';error.setAttribute('role','alert');left.append(list,toolbar);right.append(tabs,fields,error);root.append(left,right);if(treeHost){root.style.gridTemplateColumns='minmax(0,1fr)';left.className='ose-source-tree';left.style.cssText='display:flex;flex-direction:column;flex:1;min-height:0';list.style.cssText='border:0;margin-left:15px;max-height:none;min-height:100px;flex:1';toolbar.style.cssText='flex-wrap:nowrap;gap:1px;border-top:1px solid #aaa;margin-top:auto';treeHost.append(left);}
    if(!document.getElementById('ose-modal-style')){const style=el('style');style.id='ose-modal-style';style.textContent='.ose-modal{width:min(620px,90vw);max-height:85vh;overflow:auto;padding:22px;border:1px solid #d7dee8;border-radius:12px;background:var(--card,#fff);color:var(--text,#1f2937);font:14px Segoe UI;box-shadow:0 18px 60px #0f172a30}.ose-modal::backdrop{background:#0005}.ose-modal label{display:grid;grid-template-columns:150px 1fr;align-items:center;gap:10px;margin:12px 0}.ose-modal input,.ose-modal select,.ose-modal textarea{box-sizing:border-box;max-width:100%;padding:8px;border:1px solid #cbd5e1;border-radius:6px;font:inherit}.ose-modal button{padding:8px 12px;margin:5px;border:1px solid #cbd5e1;border-radius:7px;background:white;color:#1f2937;cursor:pointer}.ose-modal button:last-child{background:#16a34a;color:#fff;border-color:#16a34a}.ose-modal fieldset{border:1px solid #d7dee8;border-radius:7px;margin:10px 0}';document.head.append(style);}
    if(!document.getElementById('ose-reference-style')){const style=el('style');style.id='ose-reference-style';style.textContent='.ose-modal.ose-reference{box-sizing:border-box;padding:9px;background:#f0f0f0;color:#111;border:1px solid #bbb;border-radius:8px;font:12px Arial;box-shadow:0 10px 22px #0003}.ose-reference::backdrop{background:transparent}.ose-reference h3{font:12px Segoe UI;margin:0 -9px 12px;padding:0 9px 9px;border-bottom:1px solid #ddd}.ose-reference label{gap:6px;margin:7px 0}.ose-reference input,.ose-reference select,.ose-reference textarea{padding:2px;border:1px solid #aaa;border-radius:0;background:white;color:#111;font:12px Arial}.ose-reference button{padding:3px 12px;margin:3px;border:1px solid #c6c6c6;border-radius:3px;background:#fff;color:#111;font:12px Arial;min-height:22px}.ose-reference button:last-child{background:white;color:#111;border-color:#c6c6c6}.ose-reference button:focus-visible{outline:1px solid #0078d7;outline-offset:0}.ose-reference button:disabled{color:#999;background:#f6f6f6}.source-character-picker.ose-reference{width:min(530px,95vw)}.source-character-picker [role=tablist]{display:flex;gap:0}.source-character-picker [role=tab]{margin:0;padding:3px 7px;border-radius:0;border-bottom:0}.source-character-picker [role=tab][aria-selected=true]{background:#fff}.ose-symbol-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));max-height:194px;overflow:auto;border:1px solid #b9c7d6;background:white}.ose-symbol-grid button,.ose-recent button{display:block;border-radius:0;border:0;border-right:1px solid #222;border-bottom:1px solid #222;padding:0;margin:0;background:white;height:var(--symbol-size,86px);font-size:calc(var(--symbol-size,86px)*.65);font-family:inherit;min-width:0}.ose-symbol-grid button[aria-selected=true],.ose-recent button[aria-selected=true]{background:#268fff;color:black}.ose-recent{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));min-height:86px;border:1px solid #888;background:#ddd}.ose-control-table{border-collapse:collapse;width:100%;background:white;font:12px Arial}.ose-control-table th{text-align:left;font-weight:normal;border-right:1px solid #ccc;padding:6px}.ose-control-table td{padding:2px 6px}.ose-control-table tr[aria-selected=true]{background:#0078d7;color:white}.source-character-picker .ose-control-table{display:table}.source-character-picker [name="symbol.control"]{position:absolute;width:1px;height:1px;opacity:0;pointer-events:none}.source-character-picker [name="symbol.control"]:focus{position:static;width:auto;height:auto;opacity:1}.source-character-picker .ose-controls-scroll{height:250px;overflow:auto;border:1px solid #ccc}.ose-reference .ose-dialog-footer{display:flex;justify-content:flex-end;gap:3px;margin-top:12px}.source-description-dialog.ose-reference{width:min(435px,95vw);min-height:350px}.source-description-dialog label{display:flex;align-items:center}.source-description-dialog input[type=radio]{width:auto}.source-description-dialog input[type=text],.source-description-dialog select{width:calc(100% - 26px);margin-left:26px}.source-description-dialog select{height:172px}.source-description-dialog .ose-error{min-height:14px}';document.head.append(style);}
    if(!document.getElementById('ose-native-button-style')){const style=el('style');style.id='ose-native-button-style';style.textContent='.ose-symbol-options{display:grid;grid-template-columns:1fr 1fr;gap:12px}.ose-reference .ose-symbol-options label{grid-template-columns:40px minmax(0,1fr);margin:5px 0}.source-character-picker [name="symbol.size"]{max-width:145px}.source-character-picker [role=tab][aria-selected=true]{border-bottom:1px solid white!important;background:white!important}.source-character-picker [role=tab]{border-radius:0!important;padding:3px 7px!important;margin:0!important}dialog.ose-modal.ose-reference button[data-q-action-styled][type=button]{min-height:22px;min-width:0;padding:3px 12px;margin:3px;border:1px solid #c6c6c6;border-radius:3px;background:white;color:#111;font:12px Arial}dialog.source-character-picker.ose-reference .ose-symbol-grid button[data-q-action-styled],dialog.source-character-picker.ose-reference .ose-recent button[data-q-action-styled]{display:block;min-height:0;height:var(--symbol-size,86px);font-family:inherit;font-size:calc(var(--symbol-size,86px)*.65);margin:0;padding:0;border:0;border-right:1px solid #222;border-bottom:1px solid #222;border-radius:0}dialog.source-character-picker.ose-reference .ose-symbol-grid button[data-q-action-styled][aria-selected=true],dialog.source-character-picker.ose-reference .ose-recent button[data-q-action-styled][aria-selected=true]{background:#268fff}';document.head.append(style);}
    function update(mutator,redraw=false){if(disposed)return false;try{session.update(mutator);error.textContent='';onChange(session.draft);if(redraw)render();else renderList();return true;}catch(e){error.textContent=e.message;onDiagnostic(e.message);return false;}}
    function editSource(mutator,redraw=false){const id=selectedId();if(!id)return false;return update(doc=>{const source=doc.sourceDefinitions[id];mutator(source,doc);if(source.kind==='legacy'&&source.config?.legacyName){doc.data_sources||={};doc.data_sources[source.config.legacyName]=structuredClone(source.config.source);}},redraw);}
    async function chooseSourceInput(picker,apply){const id=selectedId(),revision=session.revision;try{const path=await picker();if(disposed||session.revision!==revision||selectedId()!==id)return;if(path)editSource(source=>apply(source,path),true);}catch(e){if(!disposed)error.textContent=e.message;}}
    function control(host,descriptor,value,onInput,prefix){
      const [key,caption,kind='text',options]=descriptor,label=el('label'),title=el('span',caption),input=el(kind==='textarea'?'textarea':['select','object','named'].includes(kind)?'select':'input');
      input.name=prefix+'.'+key;input.setAttribute('aria-label',caption);
      if(input.tagName==='INPUT')input.type=kind;
      if(input.tagName==='SELECT'){
        let values=options||[];
        if(kind==='object')values=Model.elements(snapshot()).map(e=>[e.id,e.label||e.name||e.type||e.id]);
        if(kind==='named')values=Object.values(snapshot().sourceDefinitions).filter(s=>s.name&&(prefix==='new'||s.id!==selectedId())).map(s=>[s.id,s.name]);
        const choices=[...values];if(value!=null&&!choices.some(o=>(Array.isArray(o)?o[0]:o)===value))choices.unshift([value,value]);
        if(!choices.length)choices.push(['','Choose…']);for(const choice of choices){const [v,text]=Array.isArray(choice)?choice:[choice,choice],option=el('option',text);option.value=v;input.append(option);}
      }
      if(kind==='checkbox')input.checked=Boolean(value);else input.value=value??(input.tagName==='SELECT'?input.options[0]?.value??'':'');
      if(kind==='number')input.step='any';
      let raw=String(value??'');
      const normalize=text=>text.replace(/\r\n?/g,'\n');
      function rawOffset(offset){let i=0,n=0;while(i<raw.length&&n<offset){if(raw[i]==='\r'&&raw[i+1]==='\n')i++;i++;n++;}return i;}
      input.addEventListener(input.tagName==='SELECT'?'change':'input',()=>{input.setCustomValidity('');if(!input.checkValidity())return;let next=input.value;if(kind==='textarea'){const previous=normalize(raw);let start=0,end=0;while(start<previous.length&&start<next.length&&previous[start]===next[start])start++;while(end<previous.length-start&&end<next.length-start&&previous[previous.length-1-end]===next[next.length-1-end])end++;next=raw.slice(0,rawOffset(start))+next.slice(start,next.length-end)+raw.slice(rawOffset(previous.length-end));}const valid=onInput(kind==='checkbox'?input.checked:kind==='number'?(input.value===''?undefined:Number(input.value)):next);if(valid===false)input.setCustomValidity(error.textContent||'Invalid source configuration');else raw=next;});
      label.append(title,input);
      if(kind==='textarea'&&['value','prefix','suffix','pattern'].includes(key)){
        const insert=el('button','Ω');insert.type='button';insert.title='Insert Symbols or Special Characters';insert.setAttribute('aria-label',insert.title);
        insert.onclick=event=>{event.preventDefault();const start=input.selectionStart,end=input.selectionEnd,id=selectedId(),revision=session.revision;
          openCharacterPicker(character=>{if(disposed||!input.isConnected||selectedId()!==id||session.revision!==revision)throw Error('The data source changed. Reopen the character picker.');const next=raw.slice(0,rawOffset(start))+character+raw.slice(rawOffset(end));if(onInput(next)===false)throw Error(error.textContent||'Invalid source configuration');raw=next;input.value=next;input.focus();const position=start+normalize(character).length;input.setSelectionRange(position,position);});};const wrapper=el('div');wrapper.style.cssText='display:flex;align-items:flex-start;gap:4px;min-width:0';input.style.cssText='flex:1;min-width:0';wrapper.append(input,insert);label.append(wrapper);
      }
      host.append(label);if(key==='kind'&&['source','new'].includes(prefix)&&input.tagName==='SELECT')decorateSourceType(input);return input;
    }
    function decorateSourceType(select){
      const wrapper=el('div'),toggle=el('button');wrapper.className='ose-kind-picker';toggle.type='button';toggle.setAttribute('role','combobox');toggle.setAttribute('aria-label','Data Source Type');toggle.setAttribute('aria-haspopup','listbox');toggle.setAttribute('aria-expanded','false');select.hidden=true;select.tabIndex=-1;select.before(wrapper);wrapper.append(select,toggle);let menu=null,typed='',typedAt=0;
      const icon=kind=>{const svg=document.createElementNS('http://www.w3.org/2000/svg','svg'),path=document.createElementNS('http://www.w3.org/2000/svg','path');svg.setAttribute('viewBox','0 0 16 16');svg.setAttribute('aria-hidden','true');path.setAttribute('d',sourceIconPaths[kind]||sourceIconPaths.embedded);svg.append(path);return svg;};
      function sync(){toggle.replaceChildren(icon(select.value),el('span',select.selectedOptions[0]?.textContent||'Select New Type'),el('span','⌄'));}
      function close(restore=false){if(!menu)return;menu.remove();menu=null;toggle.setAttribute('aria-expanded','false');toggle.removeAttribute('aria-controls');document.removeEventListener('pointerdown',dismiss,true);document.removeEventListener('scroll',scrollDismiss,true);document.defaultView.removeEventListener('resize',scrollDismiss);ownedMenus.delete(close);if(restore&&toggle.isConnected)toggle.focus();}
      function dismiss(event){if(!wrapper.contains(event.target))close();}
      function scrollDismiss(event){if(event.type==='resize'||!menu?.contains(event.target))close();}
      function open(){if(select.disabled||toggle.disabled)return;if(menu){close(true);return;}for(const dismiss of [...ownedMenus])dismiss();menu=el('div');menu.className='ose-kind-options';menu.id='source-kind-'+globalThis.crypto.randomUUID();menu.setAttribute('role','listbox');menu.setAttribute('aria-label','Data Source Types');toggle.setAttribute('aria-controls',menu.id);toggle.setAttribute('aria-expanded','true');
        for(const option of select.options){const button=el('button');button.type='button';button.tabIndex=-1;button.dataset.value=option.value;button.setAttribute('role','option');button.setAttribute('aria-selected',String(option.selected));button.disabled=option.disabled;button.append(icon(option.value),el('span',option.textContent));button.onclick=()=>{select.value=option.value;close();select.dispatchEvent(new document.defaultView.Event('change',{bubbles:true}));if(toggle.isConnected){sync();toggle.focus();}else root.querySelector('.ose-kind-picker [role="combobox"]')?.focus();};menu.append(button);}
        wrapper.append(menu);const box=toggle.getBoundingClientRect(),view=document.defaultView;menu.style.position='fixed';menu.style.width=Math.min(Math.max(box.width,230),view.innerWidth-16)+'px';const height=Math.min(menu.scrollHeight||320,320),below=view.innerHeight-box.bottom-8,above=box.top-8;menu.style.maxHeight=Math.max(60,Math.min(height,Math.max(below,above)))+'px';menu.style.left=Math.max(8,Math.min(box.left,view.innerWidth-menu.getBoundingClientRect().width-8))+'px';menu.style.top=(below>=height||below>=above?box.bottom+3:Math.max(8,box.top-Math.min(height,above)-3))+'px';
        menu.addEventListener('keydown',event=>{const items=[...menu.querySelectorAll('button:not(:disabled)')],index=items.indexOf(document.activeElement);if(event.key===' '||event.key==='Enter'){event.preventDefault();event.stopPropagation();items[index]?.click();}else if(event.key==='Escape'||event.key==='Tab'){event.preventDefault();event.stopPropagation();close(true);}else if(['ArrowDown','ArrowUp','Home','End'].includes(event.key)){event.preventDefault();event.stopPropagation();const next=event.key==='Home'?0:event.key==='End'?items.length-1:(index+(event.key==='ArrowUp'?-1:1)+items.length)%items.length;items[next]?.focus();}else if(event.key.length===1&&!event.ctrlKey&&!event.metaKey){event.preventDefault();event.stopPropagation();const now=Date.now();typed=now-typedAt<700?typed+event.key.toLowerCase():event.key.toLowerCase();typedAt=now;items.find(item=>item.textContent.toLowerCase().startsWith(typed))?.focus();}});
        document.addEventListener('pointerdown',dismiss,true);document.addEventListener('scroll',scrollDismiss,true);document.defaultView.addEventListener('resize',scrollDismiss);ownedMenus.add(close);menu.querySelector('[aria-selected=true]:not(:disabled)')?.focus();
      }
      toggle.onclick=open;toggle.onkeydown=event=>{if(['ArrowDown','ArrowUp'].includes(event.key)){event.preventDefault();event.stopPropagation();if(!menu)open();}};select.addEventListener('change',sync);sync();
    }
    function openCharacterPicker(insertCharacter){
      const picker=el('dialog');picker.className='source-character-picker ose-modal ose-reference';picker.append(el('h3','Insert Symbols or Special Characters'));
      const form=el('div'),message=el('p'),tabs=el('div'),controls=el('div'),symbols=el('div');message.className='ose-error';message.setAttribute('role','alert');tabs.setAttribute('role','tablist');let mode='unicode',code='29',unicode='0020';
      function selectMode(value){mode=value;controls.hidden=mode!=='control';symbols.hidden=mode!=='unicode';for(const tab of tabs.children)tab.setAttribute('aria-selected',String(tab.dataset.mode===mode));}
      for(const [value,caption]of [['unicode','Symbols'],['control','Control Characters']]){const tab=el('button',caption);tab.type='button';tab.setAttribute('role','tab');tab.dataset.mode=value;tab.onclick=()=>selectMode(value);tabs.append(tab);}
      const names=['NUL','SOH','STX','ETX','EOT','ENQ','ACK','BEL','BS','HT','LF','VT','FF','CR','SO','SI','DLE','DC1','DC2','DC3','DC4','NAK','SYN','ETB','CAN','EM','SUB','ESC','FS','GS','RS','US'];
      const controlChoice=control(controls,['control','Control Character','select',[...names.map((name,index)=>[String(index),name+' (0x'+index.toString(16).padStart(2,'0').toUpperCase()+')']),['127','DEL (0x7F)']]],code,value=>{code=value;selectMode('control');markControl();},'symbol');
      const fullNames=['Null Character','Start of Heading','Start of Text','End of Text','End of Transmission','Enquiry','Acknowledgement','Bell','Backspace','Horizontal Tab','Line Feed','Vertical Tab','Form Feed','Carriage Return','Shift Out','Shift In','Data Link Escape','Device Control 1','Device Control 2','Device Control 3','Device Control 4','Negative Acknowledgement','Synchronous Idle','End of Transmission Block','Cancel','End of Medium','Substitute','Escape','File Separator','Group Separator','Record Separator','Unit Separator'];
      const table=el('table');table.className='ose-control-table';const head=el('thead'),headRow=el('tr'),body=el('tbody');for(const caption of ['Character','Character Name','ASCII Value','Hex Value'])headRow.append(el('th',caption));head.append(headRow);table.append(head,body);
      function markControl(){for(const row of body.children)row.setAttribute('aria-selected',String(row.dataset.control===code));}
      for(const point of [...names.keys(),127]){const row=el('tr');row.dataset.control=String(point);row.tabIndex=0;row.setAttribute('role','option');for(const text of [names[point]||'DEL',fullNames[point]||'Delete',String(point).padStart(2,'0'),point.toString(16).padStart(2,'0').toUpperCase()])row.append(el('td',text));const choose=()=>{code=String(point);controlChoice.value=code;selectMode('control');markControl();};row.onclick=choose;row.onkeydown=event=>{if(event.key===' '||event.key==='Enter'){event.preventDefault();choose();}};body.append(row);}const controlScroll=el('div');controlScroll.className='ose-controls-scroll';controlScroll.append(table);controls.append(controlScroll);markControl();
      let font='Arial',subset='basic',size='large';const ranges={basic:['Basic Latin',0x20,0x7e],latin:['Latin-1 Supplement',0xa0,0xff],greek:['Greek and Coptic',0x370,0x3ff],cyrillic:['Cyrillic',0x400,0x4ff],thai:['Thai',0xe00,0xe7f],currency:['Currency Symbols',0x20a0,0x20cf],arrows:['Arrows',0x2190,0x21ff],math:['Mathematical Operators',0x2200,0x22ff],symbols:['Miscellaneous Symbols',0x2600,0x26ff]};
      const grid=el('div');grid.className='ose-symbol-grid';grid.setAttribute('role','listbox');grid.setAttribute('aria-label','Symbols');const recent=el('div');recent.className='ose-recent';recent.setAttribute('aria-label','Recently Used Characters');
      function symbolButton(point){const button=el('button',String.fromCodePoint(point));button.type='button';button.dataset.codepoint=String(point);button.title='U+'+point.toString(16).padStart(4,'0').toUpperCase();button.setAttribute('aria-label',point===32?'Space':button.textContent+' '+button.title);button.setAttribute('aria-selected',String(parseInt(unicode,16)===point));button.onclick=()=>{unicode=point.toString(16).padStart(4,'0').toUpperCase();unicodeInput.value=unicode;selectMode('unicode');for(const item of picker.querySelectorAll('[data-codepoint]'))item.setAttribute('aria-selected',String(Number(item.dataset.codepoint)===point));};return button;}
      function drawGrid(){grid.replaceChildren();const [,first,last]=ranges[subset];for(let point=first;point<=last;point++)grid.append(symbolButton(point));grid.style.fontFamily=font;recent.style.fontFamily=font;const height=size==='small'?32:size==='medium'?52:86;grid.style.setProperty('--symbol-size',height+'px');recent.style.setProperty('--symbol-size',height+'px');}
      const symbolOptions=el('div');symbolOptions.className='ose-symbol-options';symbols.append(symbolOptions);control(symbolOptions,['font','Font','select',['Arial','Segoe UI','Tahoma','Times New Roman','Consolas']],font,value=>{font=value;drawGrid();},'symbol');control(symbolOptions,['subset','Subset','select',Object.entries(ranges).map(([key,[caption]])=>[key,caption])],subset,value=>{subset=value;drawGrid();},'symbol');symbols.append(grid);
      const unicodeInput=control(symbols,['unicode','Unicode (hexadecimal)'],unicode,value=>{unicode=value;selectMode('unicode');},'symbol');
      for(const point of recentCharacters)recent.append(symbolButton(point));form.append(tabs,controls,symbols,el('p','Recently Used Characters:'),recent);control(form,['size','Size','select',[['small','Small'],['medium','Medium'],['large','Large']]],size,value=>{size=value;drawGrid();},'symbol');drawGrid();selectMode(mode);
      const close=()=>{picker.close();picker.remove();ownedDialogs.delete(picker);},cancel=el('button','Close'),insert=el('button','Insert');cancel.type=insert.type='button';cancel.onclick=close;
      insert.onclick=()=>{try{if(mode==='unicode'&&!/^[0-9a-f]{1,6}$/i.test(unicode.trim()))throw Error('Enter a Unicode hexadecimal value.');const point=mode==='unicode'?parseInt(unicode.trim(),16):Number(code);if(!Number.isInteger(point)||point<0||point>0x10ffff||point>=0xd800&&point<=0xdfff)throw Error('Enter a valid Unicode character, excluding surrogate values.');insertCharacter(String.fromCodePoint(point));if(mode==='unicode'){const old=recentCharacters.indexOf(point);if(old>=0)recentCharacters.splice(old,1);recentCharacters.unshift(point);recentCharacters.splice(8);}close();}catch(e){message.textContent=e.message;}};
      picker.addEventListener('cancel',event=>{event.preventDefault();close();});const footer=el('div');footer.className='ose-dialog-footer';footer.append(insert,cancel);picker.append(form,message,footer);ownedDialogs.add(picker);document.body.append(picker);picker.showModal();
    }
    function renderList(){
      list.replaceChildren();const doc=snapshot(),items=object(doc).dataSourceRefs||[];selected=Math.max(0,Math.min(selected,items.length-1));
      items.forEach((id,index)=>{const source=doc.sourceDefinitions[id],caption=source.name||String(source.config?.value??source.config?.source?.value??sourceKinds.find(k=>k[0]===source.kind)?.[1]??source.kind)||'<empty>',button=el('button',caption);if(treeHost){button.textContent='';const icon=document.createElementNS('http://www.w3.org/2000/svg','svg');icon.setAttribute('viewBox','0 0 16 16');icon.setAttribute('aria-hidden','true');icon.innerHTML='<path d="M3 1h8l3 3v11H3zM11 1v4h3M5 5v7M7 5v7M9 5v7M11 7v5"/>';button.append(icon,el('span',caption));}button.type='button';button.setAttribute('role','option');button.setAttribute('aria-selected',String(index===selected));button.title=caption;button.onclick=()=>{selected=index;render();};list.append(button);});
      for(const button of toolbar.children){const action=button.dataset.action;button.disabled=action==='Paste'?!clipboard:action==='New Data Source'?false:action==='GS1 Data Source Wizard'?!openGs1&&!compileGs1:action==='Move Up'?items.length===0||selected===0:action==='Move Down'?items.length===0||selected===items.length-1:items.length===0;}
    }
    function replaceKind(source,kind){if(source.kind===kind)return;source.kind=kind;source.config=kind==='vbscript'?{code:'Value = ""',event:'OnAutoSelectedEvent'}:kind==='file'?{pathMode:'literal',encoding:'utf-8'}:kind==='job'?{key:'page'}:kind==='table'?{row:'auto'}:kind==='embedded'?{value:''}:{};source.dataType={kind:'text'};source.transforms=[];delete source.configByKind;}
    function describe(){
      const id=selectedId(),revision=session.revision,original=definition().description||'',dialog=el('dialog');dialog.className='source-description-dialog ose-modal ose-reference';dialog.append(el('h3','Description'));
      let mode=original?(descriptionTerms.includes(original)?'standard':'custom'):'none',text=original,term=descriptionTerms.includes(original)?original:descriptionTerms[0];const radios=[];
      const input=el('input');input.type='text';input.name='description.text';input.value=text;input.setAttribute('aria-label','Specify description');input.oninput=()=>{text=input.value;};const terms=el('select');terms.name='description.term';terms.size=10;terms.setAttribute('aria-label','Standard term');for(const value of descriptionTerms){const option=el('option',value);option.value=value;terms.append(option);}terms.value=term;terms.onchange=()=>{term=terms.value;};
      const sync=()=>{input.disabled=mode!=='custom';terms.disabled=mode!=='standard';for(const radio of radios)radio.checked=radio.value===mode;};
      for(const [value,caption]of [['none','None'],['custom','Specify description'],['standard','Use standard term']]){const label=el('label'),radio=el('input');radio.type='radio';radio.name='description.mode';radio.value=value;radio.onchange=()=>{mode=value;sync();};radios.push(radio);label.append(radio,el('span',caption));dialog.append(label);if(value==='custom')dialog.append(input);if(value==='standard')dialog.append(terms);}sync();
      const message=el('p'),footer=el('div'),ok=el('button','OK'),cancel=el('button','Cancel');message.className='ose-error';message.setAttribute('role','alert');footer.className='ose-dialog-footer';ok.type=cancel.type='button';const close=()=>{dialog.close();dialog.remove();ownedDialogs.delete(dialog);};cancel.onclick=close;
      ok.onclick=()=>{if(disposed){close();return;}const saved=update(doc=>{if(session.revision!==revision||selectedId()!==id)throw Error('The data source changed. Reopen the description dialog.');doc.sourceDefinitions[id].description=mode==='none'?'':mode==='standard'?term:text;});if(saved){render();close();}else message.textContent=error.textContent;};footer.append(ok,cancel);dialog.append(message,footer);dialog.addEventListener('cancel',event=>{event.preventDefault();close();});ownedDialogs.add(dialog);document.body.append(dialog);dialog.showModal();
    }
    function rename(){
      const id=selectedId(),revision=session.revision,position=selected,wizard=el('dialog');wizard.className='source-name-wizard ose-modal ose-reference';wizard.style.width='min(376px,95vw)';wizard.style.minHeight='360px';let name=definition().name||'',mode='name';
      const form=el('div'),message=el('p'),cancel=el('button','Cancel'),finish=el('button','OK');message.className='ose-error';message.setAttribute('role','alert');cancel.type=finish.type='button';wizard.append(el('h3','Change Data Source Name Wizard'),el('p','Note: Named data sources can be shared between objects and/or referenced using VB Script or an external program.'),el('p','What would you like to do?'));
      const nameLabel=el('label'),nameMode=el('input');nameMode.type='radio';nameMode.name='rename.mode';nameMode.value='name';nameMode.checked=true;nameLabel.append(nameMode,el('span','Name the data source'));form.append(nameLabel);const nameInput=control(form,['name','Name'],name,value=>{name=value;},'rename');
      const linkLabel=el('label'),linkMode=el('input');linkMode.type='radio';linkMode.name='rename.mode';linkMode.value='link';linkLabel.append(linkMode,el('span','Link to existing named data source'));form.append(linkLabel);
      const candidates=Object.values(snapshot().sourceDefinitions).filter(s=>s.name&&s.id!==id);let target=candidates[0]?.id||'';const targetInput=control(form,['definitionId','Named Data Source','select',candidates.map(s=>[s.id,s.name])],target,value=>{target=value;},'rename');targetInput.size=4;
      const sync=()=>{nameInput.disabled=mode!=='name';targetInput.disabled=mode!=='link';};nameMode.onchange=()=>{mode='name';sync();};linkMode.onchange=()=>{mode='link';sync();};sync();const close=()=>{wizard.close();wizard.remove();ownedDialogs.delete(wizard);};cancel.onclick=close;
      finish.onclick=()=>{if(disposed){close();return;}const saved=update(doc=>{if(session.revision!==revision||selectedId()!==id)throw Error('The data source changed. Reopen the name wizard.');if(mode==='link'){const chosen=doc.sourceDefinitions[target];if(!chosen?.name||target===id)throw Error('Choose an existing named data source.');object(doc).dataSourceRefs[position]=target;}else Object.assign(doc,Model.renameSource(doc,id,name));});if(saved){render();close();}else message.textContent=error.textContent;};
      const footer=el('div');footer.className='ose-dialog-footer';footer.append(finish,cancel);wizard.addEventListener('cancel',event=>{event.preventDefault();close();});wizard.append(form,message,footer);ownedDialogs.add(wizard);document.body.append(wizard);wizard.showModal();
    }
    function add(replaceId){
      if(typeof replaceId!=='string')replaceId=null;
      const revision=session.revision,position=selected,wizard=el('dialog');wizard.className=(replaceId?'source-type-wizard':'source-new-wizard')+' ose-modal';
      const source=replaceId?structuredClone(snapshot().sourceDefinitions[replaceId]):{id:globalThis.crypto.randomUUID(),kind:'embedded',name:'',description:'',config:{value:''},dataType:{kind:'text'},transforms:[]};
      let step=0;const close=()=>{wizard.close();wizard.remove();ownedDialogs.delete(wizard);};
      function draw(){
        wizard.replaceChildren(el('h3',replaceId?'Change Data Source Type':'New Data Source'));
        const form=el('div'),message=el('p');message.className='ose-error';message.setAttribute('role','alert');wizard.append(form,message);
        if(step===0){control(form,['kind','Type','select',availableKinds(source.kind)],source.kind,value=>replaceKind(source,value),'new');if(replaceId)form.append(el('p','Replacing this source clears its data type options and transforms.'));}
        else{
          if(source.kind!=='named'){control(form,['name','Name'],source.name,value=>{source.name=value;},'new');control(form,['description','Description'],source.description,value=>{source.description=value;},'new');}
          for(const descriptor of sourceFields[source.kind]||[]){const key=descriptor[0],mode=source.config.pathMode||'literal';if(source.kind==='file'&&(key==='path'&&mode!=='literal'||['pathSource','defaultPath'].includes(key)&&mode==='literal'))continue;control(form,descriptor,source.config[key],value=>{source.config[key]=value;if(key==='pathMode')draw();},'new');}
        }
        const cancel=el('button','Cancel');cancel.type='button';cancel.onclick=close;wizard.append(cancel);
        if(step){const back=el('button','Back');back.type='button';back.onclick=()=>{step=0;draw();};wizard.append(back);}
        const next=el('button',step?'Finish':'Next');next.type='button';next.onclick=()=>{
          if(!step){step=1;draw();return;}
          if(disposed){close();return;}
          for(const descriptor of sourceFields[source.kind]||[]){const input=form.querySelector('[name="new.'+descriptor[0]+'"]');if(source.config[descriptor[0]]==null&&input?.tagName==='SELECT')source.config[descriptor[0]]=input.value;}
          const saved=update(doc=>{if(replaceId&&(session.revision!==revision||selectedId()!==replaceId))throw Error('The data source changed. Reopen the type wizard.');const definition=source.kind==='named'?doc.sourceDefinitions[source.config.definitionId]:source;if(source.kind==='named'&&!definition?.name)throw Error('Choose an existing named source.');if(replaceId){if(source.kind==='named')object(doc).dataSourceRefs[position]=definition.id;else doc.sourceDefinitions[replaceId]=structuredClone(source);}else Object.assign(doc,Model.addSource(doc,objectId,definition,object(doc).dataSourceRefs.length));});
          if(saved){selected=replaceId?position:refs().length-1;render();close();}else message.textContent=error.textContent;
        };wizard.append(next);
      }
      wizard.addEventListener('cancel',event=>{event.preventDefault();close();});ownedDialogs.add(wizard);document.body.append(wizard);draw();wizard.showModal();
    }
    function remove(){if(!selectedId())return;update(doc=>Object.assign(doc,Model.removeSource(doc,objectId,selected)),true);}
    function copy(cut=false){const source=definition();if(!source)return;clipboard=structuredClone(source);if(cut)remove();renderList();}
    function paste(independent=false){if(!clipboard)return;independent=independent===true;
      if(clipboard.name&&!independent){const choice=el('dialog');choice.className='ose-modal';choice.append(el('h3','Paste Named Data Source'),el('p','Choose how this object uses “'+clipboard.name+'”.'));for(const [caption,action]of [['Create Independent Copy',()=>paste(true)],['Link to Existing Named Source',()=>{const existing=Object.values(snapshot().sourceDefinitions).find(s=>s.name===clipboard.name);const source=existing||structuredClone(clipboard);update(doc=>Object.assign(doc,Model.addSource(doc,objectId,source,selected+1)),true);} ],['Cancel',()=>{}]]){const button=el('button',caption);button.type='button';button.onclick=()=>{action();choice.close();choice.remove();};choice.append(button);}ownedDialogs.add(choice);document.body.append(choice);choice.showModal();return;}
      const source={...structuredClone(clipboard),id:globalThis.crypto.randomUUID(),name:''};update(doc=>Object.assign(doc,Model.addSource(doc,objectId,source,selected+1)),false);selected++;render();}
    function move(delta){const target=selected+delta;if(target<0||target>=refs().length)return;update(doc=>Object.assign(doc,Model.moveSource(doc,objectId,selected,target)),false);selected=target;render();list.focus();}
    const actions=[['New Data Source','M8 2v12M2 8h12',add],['GS1 Data Source Wizard','M2 5V2h3M11 2h3v3M14 11v3h-3M5 14H2v-3M4 4v8M6.5 4v8M9.5 4v8M12 4v8',()=>openGs1?openGs1(session,objectId):openGs1Wizard()],['Delete','M3 4h10M6 2h4M5 5v9h6V5',remove],['Cut','M13 2 5.5 10.5M13 14 5.5 5.5M5.5 4a2 2 0 1 1-4 0 2 2 0 0 1 4 0M5.5 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0',()=>copy(true)],['Copy','M6 6h8v8H6zM2 10V2h8',()=>copy()],['Paste','M5 3H3v11h10V3h-2M6 2h4v3H6z',paste],['Move Up','M3 9l5-5 5 5M8 4v10',()=>move(-1)],['Move Down','M3 7l5 5 5-5M8 2v10',()=>move(1)]];
    for(const [name,path,action]of actions){const button=el('button');button.type='button';button.title=name;button.setAttribute('aria-label',name);button.dataset.action=name;button.innerHTML='<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="'+path+'"/></svg>';button.onclick=action;toolbar.append(button);}
    let contextMenu=null;
    function closeContextMenu(restore=false){if(!contextMenu)return;contextMenu.remove();contextMenu=null;document.removeEventListener('pointerdown',dismissContextMenu,true);document.removeEventListener('scroll',dismissContextMenu,true);if(restore&&!disposed)list.focus();}
    function dismissContextMenu(event){if(!contextMenu?.contains(event.target))closeContextMenu();}
    function showContextMenu(x,y){
      closeContextMenu();renderList();const menu=el('div');contextMenu=menu;menu.className='ose-context-menu';menu.setAttribute('role','menu');menu.setAttribute('aria-label','Data Source commands');
      menu.style.cssText='position:fixed;z-index:10000;min-width:238px;padding:3px;border:1px solid #7a9bc6;background:#f0f0f0;color:#111;box-shadow:2px 3px 5px #0004;font:12px Segoe UI';
      const shortcuts={'Delete':'Del','Cut':'Ctrl+X','Copy':'Ctrl+C','Paste':'Ctrl+V','Move Up':'(Ctrl+Up Arrow)','Move Down':'(Ctrl+Down Arrow)'};
      for(const name of ['New Data Source','Delete','Cut','Copy','Paste','Move Up','Move Down']){
        const original=[...toolbar.children].find(button=>button.dataset.action===name),button=el('button');button.type='button';button.dataset.action=name;button.setAttribute('role','menuitem');button.tabIndex=-1;button.disabled=original.disabled;button.setAttribute('aria-disabled',String(button.disabled));
        button.style.cssText='display:flex;align-items:center;gap:10px;width:100%;border:0;border-radius:0;padding:4px 5px;background:transparent;color:inherit;text-align:left;font:inherit';
        const icon=original.querySelector('svg').cloneNode(true);icon.style.cssText='width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:1.5;flex:none';const caption=el('span',name==='New Data Source'?'New':name),shortcut=el('span',shortcuts[name]||'');shortcut.style.marginLeft='auto';button.append(icon,caption,shortcut);
        if(button.disabled)button.style.color='#929292';button.onfocus=()=>{button.style.background='#cce8ff';};button.onblur=()=>{button.style.background='transparent';};button.onpointermove=()=>{if(!button.disabled)button.focus();};button.onclick=()=>{closeContextMenu(true);original.click();};menu.append(button);
      }
      // Keep the menu inside the Properties dialog's top layer, including modal hosts.
      root.append(menu);const bounds=menu.getBoundingClientRect(),view=document.defaultView;menu.style.left=Math.max(0,Math.min(x,view.innerWidth-bounds.width))+'px';menu.style.top=Math.max(0,Math.min(y,view.innerHeight-bounds.height))+'px';
      menu.addEventListener('keydown',event=>{if(runSourceShortcut(event))return;const buttons=[...menu.querySelectorAll('button:not(:disabled)')],index=buttons.indexOf(document.activeElement);if(event.key==='Escape'||event.key==='Tab'){event.preventDefault();event.stopPropagation();closeContextMenu(true);}else if(['ArrowDown','ArrowUp','Home','End'].includes(event.key)){event.preventDefault();event.stopPropagation();const next=event.key==='Home'?0:event.key==='End'?buttons.length-1:(index+(event.key==='ArrowUp'?-1:1)+buttons.length)%buttons.length;buttons[next]?.focus();}});
      document.addEventListener('pointerdown',dismissContextMenu,true);document.addEventListener('scroll',dismissContextMenu,true);menu.querySelector('button:not(:disabled)')?.focus();
    }
    function runSourceShortcut(event){const key=event.key.length===1?event.key.toLowerCase():event.key;const name=event.ctrlKey||event.metaKey?({x:'Cut',c:'Copy',v:'Paste',ArrowUp:'Move Up',ArrowDown:'Move Down'})[key]:key==='Delete'?'Delete':null;if(!name)return false;event.preventDefault();event.stopPropagation();const button=[...toolbar.children].find(item=>item.dataset.action===name);closeContextMenu(true);button?.click();return true;}
    list.addEventListener('contextmenu',event=>{event.preventDefault();event.stopPropagation();const option=event.target.closest('[role="option"]');if(option){selected=[...list.children].indexOf(option);render();}showContextMenu(event.clientX,event.clientY);});
    list.addEventListener('keydown',event=>{if(event.target.closest('input,textarea,select'))return;if(!event.ctrlKey&&!event.metaKey&&!event.altKey&&['ArrowUp','ArrowDown','Home','End'].includes(event.key)){event.preventDefault();event.stopPropagation();selected=event.key==='Home'?0:event.key==='End'?refs().length-1:Math.max(0,Math.min(refs().length-1,selected+(event.key==='ArrowUp'?-1:1)));render();list.querySelector('[aria-selected="true"]')?.focus();return;}if(event.key==='ContextMenu'||event.shiftKey&&event.key==='F10'){event.preventDefault();event.stopPropagation();const box=(list.querySelector('[aria-selected="true"]')||list).getBoundingClientRect();showContextMenu(box.left,box.bottom);return;}runSourceShortcut(event);});
    function openGs1Wizard(){
      const wizard=el('dialog');wizard.className='source-gs1-wizard ose-modal';
      const title=el('h3','GS1 Data Source Wizard'),note=el('p','Configure the Application Identifiers for this object. Finish replaces its current source list.'),body=el('div'),message=el('p'),footer=el('div'),finish=el('button','Finish'),cancel=el('button','Cancel'),addRow=el('button','Add Application Identifier');
      message.className='ose-error';footer.className='ose-actions';finish.type=cancel.type=addRow.type='button';
      const current=object(snapshot()),entries=current.gs1?current.dataSourceRefs.map(id=>({ai:snapshot().sourceDefinitions[id].gs1AI,value:snapshot().sourceDefinitions[id].config?.value||'',definitionId:id})):[{ai:'01',value:''}];
      let cancelled=false;let symbology=current.gs1?.symbology|| (current.type==='qrcode'?'gs1qrcode':current.type==='datamatrix'?'gs1datamatrix':'gs1-128');
      control(wizard,['symbology','Symbology','select',[['gs1-128','GS1-128'],['gs1datamatrix','GS1 DataMatrix'],['gs1qrcode','GS1 QR Code']]],symbology,value=>{symbology=value;},'gs1');
      function rows(){body.replaceChildren();entries.forEach((entry,index)=>{const row=el('fieldset');row.append(el('legend','Data Source '+(index+1)));control(row,['ai','Application Identifier'],entry.ai,value=>{entry.ai=value;},'gs1.'+index);control(row,['value','Data'],entry.value,value=>{entry.value=value;},'gs1.'+index);const remove=el('button','Remove');remove.type='button';remove.onclick=()=>{entries.splice(index,1);rows();};row.append(remove);body.append(row);});}
      addRow.onclick=()=>{entries.push({ai:'10',value:''});rows();};cancel.onclick=()=>{cancelled=true;wizard.close();wizard.remove();ownedDialogs.delete(wizard);};wizard.addEventListener('cancel',event=>{event.preventDefault();cancel.click();});
      function setBusy(busy){for(const control of wizard.querySelectorAll('input,select,textarea,button'))if(control!==cancel)control.disabled=busy;}
      finish.onclick=async()=>{setBusy(true);const revision=session.revision;try{const result=await compileGs1({entries:entries.map(({ai,value})=>({ai,value})),symbology});if(cancelled||disposed)return;if(session.revision!==revision)throw Error('The data sources changed. Review this wizard and try again.');if(!result.ok)throw Error(result.error);
        const saved=update(doc=>{const target=object(doc),newRefs=[];for(const entry of entries){const id=entry.definitionId||globalThis.crypto.randomUUID(),existing=doc.sourceDefinitions[id];doc.sourceDefinitions[id]={...(existing||{id,kind:'embedded',name:'',dataType:{kind:'text'},transforms:[]}),gs1AI:entry.ai,config:{...(existing?.config||{}),value:entry.value}};newRefs.push(id);}target.dataSourceRefs=newRefs;target.gs1={symbology};target.type='image';target.barcode_spec={...(target.barcode_spec||{}),bcid:symbology,text:result.encodedText,show_text:target.show_text!==false};target.sourceTextSnapshot=result.encodedText;target.width_mm=Number(target.width_mm)||50;target.height_mm=Number(target.height_mm)||Number(target.bar_height_mm)||20;},true);
        if(!saved){message.textContent=error.textContent;return;}cancel.click();
      }catch(error){message.textContent=error.message;}finally{setBusy(false);}};
      footer.append(cancel,finish);wizard.prepend(title,note);wizard.append(body,addRow,message,footer);ownedDialogs.add(wizard);document.body.append(wizard);rows();wizard.showModal();
    }
    function renderType(source){
      const config=source.dataType||{kind:'text'},types=Types.kinds;control(fields,['kind','Type','select',types.map(k=>[k,k[0].toUpperCase()+k.slice(1)])],config.kind,value=>editSource(s=>{s.dataType={...s.dataType,kind:value};},true),'type');
      let descriptors=[];
      if(['date','time'].includes(config.kind))descriptors=[['locale','Locale'],['calendar','Calendar'],['pattern','Pattern'],['timeZone','Time Zone']];
      if(['number','currency','percentage','fraction'].includes(config.kind))descriptors=[['locale','Locale'],['inputLocale','Input Locale'],['nativeNumerals','Use Native Numerals','checkbox'],['grouping','Use Digit Grouping Separator','checkbox'],['decimals','Decimal Places','number']];
      if(config.kind==='number')descriptors.push(['notation','Format','select',['decimal','hex','roman','scientific']],['minimumLength','Minimum Length','number'],['lowercase','Use Lowercase Letters','checkbox']);
      if(config.kind==='currency')descriptors.push(['currency','Currency']);
      if(config.kind==='fraction')descriptors.push(['precision','Precision','select',[['custom','Custom Denominator'],['up-to-1','Up to 1 Digit'],['up-to-2','Up to 2 Digits'],['up-to-3','Up to 3 Digits'],['halves','As Halves'],['quarters','As Quarters'],['eighths','As Eighths'],['sixteenths','As Sixteenths'],['tenths','As Tenths'],['hundredths','As Hundredths'],['reduced-quarters','Reduced Quarters'],['reduced-eighths','Reduced Eighths'],['reduced-sixteenths','Reduced Sixteenths']]],['denominator','Denominator','number'],['improper','Improper Fractions','checkbox'],['composite','Use Composite Fraction Symbols','checkbox']);
      if(config.kind==='binary')descriptors=[['encoding','Input Encoding','select',['utf-8','hex','base64']]];
      if(config.kind==='picture')descriptors=[['format','Format','select',['png','jpeg','bmp']],['colors','Colors','select',['monochrome','grayscale','color']],['dithering','Dithering','select',['none','threshold','floyd-steinberg']],['quality','Quality','number'],['sizing','Sizing Method','select',['fit','stretch','percentage']],['width','Width','number'],['height','Height','number'],['percentage','Percentage of Original Size','number']];
      for(const descriptor of descriptors){const key=descriptor[0];if(config.kind==='fraction'&&key==='denominator'&&config.precision&&config.precision!=='custom')continue;control(fields,descriptor,config[key]??(key==='grouping'?true:key==='denominator'?1000:undefined),value=>editSource(s=>{s.dataType||={kind:'text'};s.dataType[key]=value;},key==='precision'),'type');}
    }
    function replaceActions(host,config,save,redraw=render){
      const actions=el('div');host.append(actions);
      (config.actions||[]).forEach((action,index)=>{
        const row=el('fieldset');row.append(el('legend','Action '+(index+1)));
        const operation=action.operation||'replace',syntax=action.syntax||(action.regex?'regex':'literal');
        const descriptors=[['operation','Action','select',[['replace','Replace'],['delete','Delete'],['insert-before','Insert Before'],['insert-after','Insert After']]],['search','Search For'],['syntax','Syntax','select',[['literal','Literal'],['wildcard','Wildcard'],['regex','Regular Expression']]]];
        if(operation==='replace')descriptors.push(['replace','Replace With']);
        if(operation.startsWith('insert-'))descriptors.push(['insert','Insert']);
        descriptors.push(['all','All Occurrences','checkbox']);
        for(const field of descriptors){const key=field[0],value=key==='operation'?operation:key==='syntax'?syntax:key==='all'?action.all!==false:action[key];control(row,field,value,value=>{action[key]=value;if(key==='syntax')action.regex=value==='regex';save();if(key==='operation')redraw();},'replace.'+index);}
        const buttons=el('div');buttons.className='ose-actions';
        for(const [caption,fn] of [['Delete',()=>config.actions.splice(index,1)],['Move Up',()=>{if(index>0)config.actions.splice(index-1,0,config.actions.splice(index,1)[0]);}],['Move Down',()=>{if(index<config.actions.length-1)config.actions.splice(index+1,0,config.actions.splice(index,1)[0]);}]]){const button=el('button',caption);button.type='button';button.onclick=()=>{fn();save();redraw();};buttons.append(button);}
        row.append(buttons);actions.append(row);
      });
      const button=el('button','Add Action');button.type='button';button.onclick=()=>{config.actions||=[];config.actions.push({operation:'replace',syntax:'literal',search:'',replace:'',all:true});save();redraw();};host.append(button);
    }
    function openTransform(kind,name){
      const id=selectedId(),revision=session.revision,source=definition(),existing=(source.transforms||[]).find(t=>t.kind===kind),local=existing?structuredClone(existing):{kind,...structuredClone(defaults[kind]),enabled:kind!=='suppression'},dialog=el('dialog');dialog.className='source-transform-dialog ose-modal ose-reference';dialog.dataset.kind=kind;
      const header=el('h3',name),body=el('div'),message=el('p'),footer=el('div'),ok=el('button','OK'),cancel=el('button','Cancel');message.className='ose-error';message.setAttribute('role','alert');footer.className='ose-dialog-footer';ok.type=cancel.type='button';
      const close=()=>{dialog.close();dialog.remove();ownedDialogs.delete(dialog);};cancel.onclick=close;
      function draw(){body.replaceChildren();control(body,['enabled','Use '+name,'checkbox'],local.enabled!==false,value=>{local.enabled=value;},'transform.'+kind);
        if(kind==='search-replace'){replaceActions(body,local,()=>{},draw);return;}
        if(kind==='truncation'){
          for(const [key,caption]of [['trimStart','Trim spaces on left'],['trimEnd','Trim spaces on right']])control(body,[key,caption,'checkbox'],local[key],value=>{local[key]=value;},'transform.'+kind);
          for(const [key,caption]of [['discardLeft','Discard characters on left'],['discardRight','Discard characters on right'],['keepLeft','Keep characters on left'],['keepRight','Keep characters on right']]){const enabled=local[key]!=null;control(body,[key+'Enabled',caption,'checkbox'],enabled,value=>{if(value)local[key]=0;else delete local[key];draw();},'transform.'+kind);const count=control(body,[key,'Number of characters','number'],local[key],value=>{local[key]=value;},'transform.'+kind);count.min='0';count.step='1';count.disabled=!enabled;}
          if(local.trim||local.start!=null||local.length!=null){const legacy=el('fieldset');legacy.append(el('legend','Existing settings'));for(const descriptor of transformFields.truncation)control(legacy,descriptor,local[descriptor[0]],value=>{local[descriptor[0]]=value;},'transform.'+kind);body.append(legacy);}return;
        }
        for(const descriptor of transformFields[kind]||[]){const key=descriptor[0],mode=local.offsetSource||'constant';if(kind==='offset'&&(key==='amount'&&mode!=='constant'||key==='source'&&mode==='constant'||key==='unit'&&!['date','time'].includes(source.dataType?.kind)))continue;control(body,descriptor,local[key],value=>{if(kind==='serialization'&&key==='start'&&value==='')delete local[key];else local[key]=value;if(key==='offsetSource')draw();},'transform.'+kind);}
      }
      ok.onclick=()=>{if(disposed){close();return;}if([...body.querySelectorAll('input,select,textarea')].some(input=>!input.reportValidity()))return;const saved=update(doc=>{if(session.revision!==revision||selectedId()!==id)throw Error('The data source changed. Reopen this transform.');const target=doc.sourceDefinitions[id];target.transforms||=[];const index=target.transforms.findIndex(t=>t.kind===kind);if(index<0)target.transforms.push(structuredClone(local));else target.transforms[index]=structuredClone(local);});if(saved){close();render();}else message.textContent=error.textContent;};
      if(testTransform){const test=el('button',kind==='vbscript'?'Test Script':'Test Transform'),output=el('output');test.type='button';output.className='ose-transform-output';output.setAttribute('aria-live','polite');test.onclick=async()=>{if([...body.querySelectorAll('input,select,textarea')].some(input=>!input.reportValidity()))return;const candidate=snapshot(),target=candidate.sourceDefinitions[id];target.transforms||=[];const index=target.transforms.findIndex(t=>t.kind===kind);if(index<0)target.transforms.push(structuredClone(local));else target.transforms[index]=structuredClone(local);const locked=[...body.querySelectorAll('input,select,textarea,button')].map(control=>[control,control.disabled]);for(const [control]of locked)control.disabled=true;test.disabled=ok.disabled=true;output.textContent='Running…';try{const value=await testTransform(candidate,objectId);if(!disposed&&dialog.isConnected&&session.revision===revision&&selectedId()===id)output.textContent=String(value);}catch(error){if(!disposed&&dialog.isConnected&&session.revision===revision&&selectedId()===id)output.textContent=error.message;}finally{if(dialog.isConnected){for(const [control,disabled]of locked)control.disabled=disabled;test.disabled=ok.disabled=false;}}};dialog.append(test,output);}footer.append(ok,cancel);dialog.prepend(header,body);dialog.append(message,footer);dialog.addEventListener('cancel',event=>{event.preventDefault();close();});ownedDialogs.add(dialog);root.append(dialog);draw();dialog.showModal();
    }
    function renderTransforms(source){
      for(const [kind,name]of visibleTransforms(source)){const row=el('div'),check=el('input'),caption=el('span',name),summary=el('input'),configure=el('button','Configure…');row.className='ose-transform';row.dataset.transformKind=kind;check.type='checkbox';check.setAttribute('aria-label','Enable '+name);const config=(source.transforms||[]).find(t=>t.kind===kind);check.checked=Boolean(config&&config.enabled!==false);check.onchange=()=>editSource(s=>{s.transforms||=[];const entry=s.transforms.find(t=>t.kind===kind);if(entry)entry.enabled=check.checked;else s.transforms.push({kind,...structuredClone(defaults[kind]),enabled:true});},true);
        summary.readOnly=true;summary.setAttribute('aria-label',name+' settings');summary.value=!config||config.enabled===false?'<None>':Object.entries(config).filter(([key])=>!['kind','enabled'].includes(key)).map(([key,value])=>key+': '+(typeof value==='object'?JSON.stringify(value):String(value))).join('; ')||'Configured';summary.title=summary.value;configure.type='button';configure.setAttribute('aria-label','Configure '+name);configure.onclick=()=>openTransform(kind,name);row.append(check,caption,summary,configure);fields.append(row);
      }
    }
    function render(){
      if(disposed)return;for(const close of [...ownedMenus])close();state.selected=selected;state.tab=tab;renderList();tabs.replaceChildren();fields.replaceChildren();
      for(const name of ['Data Source','Data Type','Transforms']){const button=el('button',name);button.type='button';button.setAttribute('role','tab');button.setAttribute('aria-selected',String(tab===name));button.onclick=()=>{tab=name;render();};tabs.append(button);}
      const source=definition();if(!source){fields.append(el('p','Add a data source to this object.'));return;}
      if(tab==='Data Type'){renderType(source);return;}if(tab==='Transforms'){renderTransforms(source);return;}
      function propertyAction(input,caption,action){input.placeholder='<none>';input.disabled=true;input.tabIndex=-1;input.classList.add('ose-property-display');const picker=input.closest('.ose-kind-picker');if(picker){const toggle=picker.querySelector('[role=combobox]');toggle.disabled=true;toggle.tabIndex=-1;toggle.classList.add('ose-property-display');toggle.lastElementChild.hidden=true;}const label=input.closest('label'),widget=input.closest('.ose-kind-picker')||input,wrapper=el('div'),button=el('button');wrapper.style.cssText='display:grid;grid-template-columns:minmax(0,1fr) 22px;gap:6px;align-items:center';button.type='button';button.title=caption;button.setAttribute('aria-label',caption);button.style.cssText='width:22px;height:22px;margin:0;padding:2px;border:1px solid #b8bec6;border-radius:2px;background:#fafafa;color:#163c63';button.innerHTML='<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M2 3h10v11H2zM4 5h5M4 8h4M4 11h6" fill="white" stroke="currentColor"/><path d="m8 4 5-3 2 2-5 3-3 1z" fill="#ffe583" stroke="#5285a6"/></svg>';button.onclick=action;wrapper.append(widget,button);label.append(wrapper);}
      const nameInput=control(fields,['name','Name'],source.name,value=>update(doc=>Object.assign(doc,Model.renameSource(doc,selectedId(),value))),'source'),descriptionInput=control(fields,['description','Description'],source.description,value=>editSource(s=>{s.description=value;}),'source');
      propertyAction(nameInput,'Change Data Source Name…',rename);propertyAction(descriptionInput,'Change Data Source Description…',describe);
      if(source.gs1AI)control(fields,['gs1AI','Application Identifier'],source.gs1AI,value=>editSource(s=>{s.gs1AI=value;}),'source');
      const kindInput=control(fields,['kind','Type','select',source.kind==='legacy'?[['legacy','Existing Data Source'],...availableKinds(source.kind)]:availableKinds(source.kind)],source.kind,value=>editSource(s=>replaceKind(s,value),true),'source');
      propertyAction(kindInput,'Change Data Source Type…',()=>add(selectedId()));
      if(source.kind==='legacy'){const p=el('p','This source uses an existing document field. Its current definition is preserved.');p.className='ose-note';fields.append(p);const original=source.config.source||{};if(['constant','expression','entry','global'].includes(original.type))control(fields,['value','Value','textarea'],original.value,value=>editSource(s=>{s.config.source.value=value;}),'source');return;}
      for(const descriptor of sourceFields[source.kind]||[]){const key=descriptor[0],mode=source.config?.pathMode||'literal';if(source.kind==='file'&&(key==='path'&&mode!=='literal'||['pathSource','defaultPath'].includes(key)&&mode==='literal'))continue;control(fields,descriptor,source.config?.[key],value=>editSource(s=>{s.config||={};s.config[key]=value;},key==='pathMode'),'source');}
      if(source.kind==='file'&&(!source.config?.pathMode||source.config.pathMode==='literal')&&chooseFile){const button=el('button','Browse…');button.type='button';button.onclick=()=>chooseSourceInput(chooseFile,(source,path)=>{source.config.path=path;});fields.append(button);}
      if(source.kind==='file'&&source.config?.pathMode&&source.config.pathMode!=='literal'&&chooseDirectory){const button=el('button','Select Path…');button.type='button';button.onclick=()=>chooseSourceInput(chooseDirectory,(source,path)=>{source.config.defaultPath=path;});fields.append(button);}
      if(source.kind==='library'){
        const manage=el('button','Manage Phrases…');manage.type='button';manage.onclick=()=>openPhraseEditor();fields.append(manage);
        control(fields,['libraryFile','Library File'],source.config?.libraryFile,value=>{const saved=editSource(s=>{s.config.libraryFile=value;});const browse=fields.querySelector('[data-library-browse]');if(browse)browse.disabled=!value;return saved;},'source');
        if(chooseFile){const connect=el('button','Connect Library File…');connect.type='button';connect.onclick=()=>chooseSourceInput(chooseFile,(source,path)=>{source.config.libraryFile=path;});fields.append(connect);}
        if(inspectLibrary){const browse=el('button','Browse Library Phrases…');browse.type='button';browse.dataset.libraryBrowse='';browse.disabled=!source.config?.libraryFile;browse.onclick=()=>openLibraryPicker();fields.append(browse);}
      }
    }
    async function openLibraryPicker(){
      const id=selectedId(),revision=session.revision,config=definition().config||{};let result;
      try{result=await inspectLibrary(config.libraryFile);if(disposed||revision!==session.revision||selectedId()!==id)return;if(!result?.libraries?.length)throw Error('The file contains no text libraries.');}catch(e){if(!disposed&&revision===session.revision&&selectedId()===id)error.textContent=e.message;return;}
      const picker=el('dialog');picker.className='source-library-picker ose-modal';picker.append(el('h3','Library Phrase'));const body=el('div'),message=el('p'),cancel=el('button','Cancel'),save=el('button','Use Phrase');message.className='ose-error';cancel.type=save.type='button';
      let library=result.libraries.find(item=>item.name===config.library)||result.libraries[0],phrase,language;
      const choosePhrase=()=>{phrase=library.phrases.find(item=>item.id===config.phrase)||library.phrases[0];language=phrase?.languages.find(item=>item.name===config.language)||phrase?.languages[0];};choosePhrase();
      function draw(){body.replaceChildren();control(body,['name','Library','select',result.libraries.map(item=>[item.name,item.name])],library.name,value=>{library=result.libraries.find(item=>item.name===value);choosePhrase();draw();},'library');control(body,['phrase','Phrase ID','select',library.phrases.map(item=>[item.id,item.id])],phrase?.id,value=>{phrase=library.phrases.find(item=>item.id===value);language=phrase?.languages[0];draw();},'library');control(body,['language','Language','select',(phrase?.languages||[]).map(item=>[item.name,item.name||'Default'])],language?.name,value=>{language=phrase.languages.find(item=>item.name===value);draw();},'library');body.append(el('output',language?.value||''));save.disabled=!phrase||!language;}
      const close=()=>{picker.close();picker.remove();ownedDialogs.delete(picker);};cancel.onclick=close;save.onclick=()=>{const saved=update(doc=>{if(revision!==session.revision||selectedId()!==id)throw Error('The data source changed. Reopen the phrase picker.');Object.assign(doc.sourceDefinitions[id].config,{library:library.name,phrase:phrase.id,language:language.name});},true);if(saved)close();else message.textContent=error.textContent;};picker.addEventListener('cancel',event=>{event.preventDefault();close();});picker.append(body,message,cancel,save);ownedDialogs.add(picker);document.body.append(picker);draw();picker.showModal();
    }
    function openPhraseEditor(){
      const source=definition(),dialog=el('dialog');dialog.className='ose-modal';dialog.append(el('h3','Phrase Library'));
      const entry={library:source.config?.library||'Library 1',phrase:source.config?.phrase||'Phrase 1',language:source.config?.language||'en',value:''},list=el('select');list.setAttribute('aria-label','Existing Phrase');const blank=el('option','New Phrase');blank.value='';list.append(blank);
      for(const [library,phrases]of Object.entries(snapshot().sourceLibraries||{}))for(const [phrase,languages]of Object.entries(phrases))for(const [language,value]of Object.entries(languages)){const option=el('option',library+' / '+phrase+' / '+language);option.value=JSON.stringify({library,phrase,language,value});list.append(option);}
      const form=el('div');function draw(){form.replaceChildren();for(const descriptor of [['library','Library (in this document)'],['phrase','Phrase ID'],['language','Language'],['value','Phrase','textarea']])control(form,descriptor,entry[descriptor[0]],value=>{entry[descriptor[0]]=value;},'phrase');}
      list.onchange=()=>{if(list.value)Object.assign(entry,JSON.parse(list.value));draw();};const save=el('button','Use Phrase'),cancel=el('button','Cancel');save.type=cancel.type='button';
      save.onclick=()=>{if(!entry.library||!entry.phrase||!entry.language)return;const saved=update(doc=>{doc.sourceLibraries||={};if(!Object.hasOwn(doc.sourceLibraries,entry.library))Object.defineProperty(doc.sourceLibraries,entry.library,{value:{},enumerable:true,writable:true,configurable:true});const library=doc.sourceLibraries[entry.library];if(!Object.hasOwn(library,entry.phrase))Object.defineProperty(library,entry.phrase,{value:{},enumerable:true,writable:true,configurable:true});Object.defineProperty(library[entry.phrase],entry.language,{value:entry.value,enumerable:true,writable:true,configurable:true});Object.assign(doc.sourceDefinitions[selectedId()].config,{library:entry.library,phrase:entry.phrase,language:entry.language,libraryFile:''});},true);if(saved){dialog.close();dialog.remove();}};
      cancel.onclick=()=>{dialog.close();dialog.remove();};dialog.addEventListener('cancel',event=>{event.preventDefault();cancel.click();});dialog.append(list,form,cancel,save);ownedDialogs.add(dialog);document.body.append(dialog);draw();dialog.showModal();
    }
    if(!document.getElementById('ose-modern-theme')){const theme=el('link');theme.id='ose-modern-theme';theme.rel='stylesheet';theme.href='object-data-sources-modern.css';document.head.append(theme);}
    render();return {dispose(){disposed=true;closeContextMenu();for(const close of [...ownedMenus])close();for(const wizard of ownedDialogs){wizard.close();wizard.remove();}ownedDialogs.clear();state.selected=selected;state.tab=tab;treeHost?.classList.remove('ose-tree-host');left.remove();root.remove();},refresh:render};
  }
  return {mount,sourceKinds,transformNames};
});
