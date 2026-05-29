## dm-sidebyside-extension build and deployment steps(refer this path for project structure [dm-sidebyside-extension/SideBySide_AssemblyPOD_CF](../dm-sidebyside-extension/SideBySide_AssemblyPOD_CF))

    Step 1: Validate plug in structure with (../dm-sidebyside-extension/SideBySide_AssemblyPOD_CF)
    Step 2: If structure is match then go to step 3 else go to step 7.
    Step 3: Check if already log in to cf if yes then go to step 5 else go to step 4.
    step 4: cf login
        API End Point:API_End_Point -(read from docs/refrencevalue.env file and key is API_End_Point)
        Email:LOGIN_EMAIL_ID -(read from docs/refrencevalue.env file and key is LOGIN_EMAIL_ID)
        Password:PWD -(read from docs/refrencevalue.env file and key is PWD)
    step 5: mbt build -p=cf
    step 6: cf deploy mta_archives/*.mtar -f
    Step 7: provide details analysis on screen.

## dm-pod-plugin build and deployment steps(refer this path for project structure [datacollection-edit-UI](../datacollection-edit-UI))
    
    Step 1: Validate plug in structure with (../datacollection-edit-UI)
    Step 2: If structure is match then go to step 3 else go to step 7.
    Step 3: Check if already log in to cf if yes then go to step 5 else go to step 4.
    step 4: cf login
        API End Point:API_End_Point -(read from docs/refrencevalue.env file and key is API_End_Point)
        Email:LOGIN_EMAIL_ID -(read from docs/refrencevalue.env file and key is LOGIN_EMAIL_ID)
        Password:PWD -(read from docs/refrencevalue.env file and key is PWD)
    step 5: mbt build -p=cf
    step 6: cf deploy mta_archives/*.mtar -f
    Step 7: provide details analysis on screen.

## dm-coreplugin-extensions build and deployment steps(refer this path for project structure [dm-coreplugin-extensions](../dm-coreplugin-extensions/plugins/webapp/assemblyPointExtensionProvider))

    Step 1: Validate plug in structure with (../dm-coreplugin-extensions)
    Step 2: If structure is match then go to step 3 else go to step 7.
    Step 3: Check if already log in to cf if yes then go to step 5 else go to step 4.
    step 4: cf login
        API End Point:API_End_Point -(read from docs/refrencevalue.env file and key is API_End_Point)
        Email:LOGIN_EMAIL_ID -(read from docs/refrencevalue.env file and key is LOGIN_EMAIL_ID)
        Password:PWD -(read from docs/refrencevalue.env file and key is PWD)
    step 5: mbt build -p=cf
    step 6: cf deploy mta_archives/*.mtar -f
    Step 7: provide details analysis on screen.

## cap-custom-plugins build and deployment steps(refer this path for project structure [cap-custom-plugins](../dm-extension-scenarios/cap-custom-plugins))

    Step 1: Validate plug in structure with (../dm-extension-scenarios/cap-custom-plugins)
    Step 2: If structure is match then go to step 3 else go to step 7.
    Step 3: Check if already log in to cf if yes then go to step 5 else go to step 4.
    step 4: cf login
        API End Point:API_End_Point -(read from docs/refrencevalue.env file and key is API_End_Point)
        Email:LOGIN_EMAIL_ID -(read from docs/refrencevalue.env file and key is LOGIN_EMAIL_ID)
        Password:PWD -(read from docs/refrencevalue.env file and key is PWD)
    step 5: mbt build -p=cf
    step 6: cf deploy mta_archives/*.mtar -f
    Step 7: provide details analysis on screen.