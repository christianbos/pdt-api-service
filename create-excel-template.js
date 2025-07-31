const XLSX = require('xlsx');

// Create Excel template based on the card data structure
function createCardTemplate() {
  // Define the headers based on the card data structure
  const headers = [
    // Basic card information
    'name',
    'set',
    'number',
    'year',
    'rarity',
    'finalGrade',
    'certificationNumber',
    'version',
    'has3DScan',
    
    // Surface scores
    'surface_finalScore',
    'surface_bent',
    'surface_bentWeight',
    'surface_front_color',
    'surface_front_scratches',
    'surface_front_colorWeight',
    'surface_front_scratchesWeight',
    'surface_front_totalWeight',
    'surface_back_color',
    'surface_back_scratches',
    'surface_back_colorWeight',
    'surface_back_scratchesWeight',
    'surface_back_totalWeight',
    
    // Edges scores
    'edges_finalScore',
    'edges_frontWeight',
    'edges_backWeight',
    'edges_front_left',
    'edges_front_top',
    'edges_front_right',
    'edges_front_bottom',
    'edges_back_left',
    'edges_back_top',
    'edges_back_right',
    'edges_back_bottom',
    
    // Corners scores
    'corners_finalScore',
    'corners_frontWeight',
    'corners_backWeight',
    'corners_front_topLeft',
    'corners_front_topRight',
    'corners_front_bottomLeft',
    'corners_front_bottomRight',
    'corners_back_topLeft',
    'corners_back_topRight',
    'corners_back_bottomLeft',
    'corners_back_bottomRight',
    
    // Centering scores
    'centering_frontScore',
    'centering_backScore',
    'centering_finalScore',
    'centering_front_left',
    'centering_front_top',
    'centering_back_left',
    'centering_back_top'
  ];

  // Sample data rows based on the provided cards
  const sampleData = [
    {
      name: 'Pétalos de fuego',
      set: 'GUERRA ROJA',
      number: '#LGRO-006U',
      year: '2025',
      rarity: 'ULTRA RARA',
      finalGrade: 9,
      certificationNumber: 1,
      version: 1,
      has3DScan: false,
      surface_finalScore: 8,
      surface_bent: null,
      surface_bentWeight: null,
      surface_front_color: 8,
      surface_front_scratches: 8,
      surface_front_colorWeight: 0.3,
      surface_front_scratchesWeight: 0.7,
      surface_front_totalWeight: 0.45,
      surface_back_color: 8,
      surface_back_scratches: 8,
      surface_back_colorWeight: 0.3,
      surface_back_scratchesWeight: 0.7,
      surface_back_totalWeight: 0.45,
      edges_finalScore: 9.5,
      edges_frontWeight: null,
      edges_backWeight: null,
      edges_front_left: 9.5,
      edges_front_top: 9.5,
      edges_front_right: 9.5,
      edges_front_bottom: 9.5,
      edges_back_left: 9.5,
      edges_back_top: 9.5,
      edges_back_right: 9.5,
      edges_back_bottom: 9.5,
      corners_finalScore: 10,
      corners_frontWeight: 0.6,
      corners_backWeight: 0.4,
      corners_front_topLeft: 10,
      corners_front_topRight: 10,
      corners_front_bottomLeft: 10,
      corners_front_bottomRight: 10,
      corners_back_topLeft: 10,
      corners_back_topRight: 10,
      corners_back_bottomLeft: 10,
      corners_back_bottomRight: 10,
      centering_frontScore: 10,
      centering_backScore: 10,
      centering_finalScore: 10,
      centering_front_left: 10,
      centering_front_top: 10,
      centering_back_left: 10,
      centering_back_top: 10
    },
    {
      name: 'Regigigas Vstar',
      set: 'CROWN ZENITH',
      number: '#114',
      year: '2023',
      rarity: 'ULTRA RARE',
      finalGrade: 10,
      certificationNumber: 10,
      version: 1,
      has3DScan: false,
      surface_finalScore: 9.5,
      surface_bent: 10,
      surface_bentWeight: null,
      surface_front_color: 9.5,
      surface_front_scratches: 9.5,
      surface_front_colorWeight: 0.3,
      surface_front_scratchesWeight: 0.7,
      surface_front_totalWeight: 0.45,
      surface_back_color: 9.5,
      surface_back_scratches: 9.5,
      surface_back_colorWeight: 0.3,
      surface_back_scratchesWeight: 0.7,
      surface_back_totalWeight: 0.45,
      edges_finalScore: 10,
      edges_frontWeight: 0.6,
      edges_backWeight: 0.4,
      edges_front_left: 10,
      edges_front_top: 10,
      edges_front_right: 10,
      edges_front_bottom: 10,
      edges_back_left: 10,
      edges_back_top: 10,
      edges_back_right: 10,
      edges_back_bottom: 10,
      corners_finalScore: 10,
      corners_frontWeight: 0.6,
      corners_backWeight: 0.4,
      corners_front_topLeft: 10,
      corners_front_topRight: 10,
      corners_front_bottomLeft: 10,
      corners_front_bottomRight: 10,
      corners_back_topLeft: 10,
      corners_back_topRight: 10,
      corners_back_bottomLeft: 10,
      corners_back_bottomRight: 10,
      centering_frontScore: 9.5,
      centering_backScore: 9.5,
      centering_finalScore: 9.5,
      centering_front_left: 9.5,
      centering_front_top: 9.5,
      centering_back_left: 9.5,
      centering_back_top: 9.5
    },
    {
      name: 'Poliwhirl',
      set: 'SCARLET & VIOLET 151',
      number: '#176',
      year: '2023',
      rarity: 'ILLUSTRATION RARE',
      finalGrade: 9.5,
      certificationNumber: 11,
      version: 1,
      has3DScan: false,
      surface_finalScore: 10,
      surface_bent: 10,
      surface_bentWeight: null,
      surface_front_color: 10,
      surface_front_scratches: 10,
      surface_front_colorWeight: 0.3,
      surface_front_scratchesWeight: 0.7,
      surface_front_totalWeight: 0.45,
      surface_back_color: 10,
      surface_back_scratches: 10,
      surface_back_colorWeight: 0.3,
      surface_back_scratchesWeight: 0.7,
      surface_back_totalWeight: 0.45,
      edges_finalScore: 10,
      edges_frontWeight: 0.6,
      edges_backWeight: 0.4,
      edges_front_left: 10,
      edges_front_top: 10,
      edges_front_right: 10,
      edges_front_bottom: 10,
      edges_back_left: 10,
      edges_back_top: 10,
      edges_back_right: 10,
      edges_back_bottom: 10,
      corners_finalScore: 10,
      corners_frontWeight: 0.6,
      corners_backWeight: 0.4,
      corners_front_topLeft: 10,
      corners_front_topRight: 10,
      corners_front_bottomLeft: 10,
      corners_front_bottomRight: 10,
      corners_back_topLeft: 10,
      corners_back_topRight: 10,
      corners_back_bottomLeft: 10,
      corners_back_bottomRight: 10,
      centering_frontScore: 10,
      centering_backScore: 10,
      centering_finalScore: 10,
      centering_front_left: 10,
      centering_front_top: 10,
      centering_back_left: 10,
      centering_back_top: 10
    }
  ];

  // Create workbook and worksheet
  const wb = XLSX.utils.book_new();
  
  // Create the template sheet with headers and sample data
  const ws = XLSX.utils.json_to_sheet(sampleData);
  
  // Add the worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Cards Import Template');
  
  // Create instructions sheet
  const instructions = [
    {
      'Field': 'name',
      'Description': 'Nombre de la carta',
      'Type': 'Text',
      'Required': 'Yes',
      'Example': 'Pikachu'
    },
    {
      'Field': 'set',
      'Description': 'Set o colección de la carta',
      'Type': 'Text',
      'Required': 'Yes',
      'Example': 'BASE SET'
    },
    {
      'Field': 'number',
      'Description': 'Número de la carta en el set',
      'Type': 'Text',
      'Required': 'Yes',
      'Example': '#025/102'
    },
    {
      'Field': 'year',
      'Description': 'Año de publicación',
      'Type': 'Text',
      'Required': 'Yes',
      'Example': '1998'
    },
    {
      'Field': 'rarity',
      'Description': 'Rareza de la carta',
      'Type': 'Text',
      'Required': 'Yes',
      'Example': 'RARE'
    },
    {
      'Field': 'finalGrade',
      'Description': 'Grado final de la carta (0-10)',
      'Type': 'Number',
      'Required': 'Yes',
      'Example': '9.5'
    },
    {
      'Field': 'certificationNumber',
      'Description': 'Número único de certificación',
      'Type': 'Number',
      'Required': 'Yes',
      'Example': '12345'
    },
    {
      'Field': 'version',
      'Description': 'Versión de la carta',
      'Type': 'Number',
      'Required': 'Yes',
      'Example': '1'
    },
    {
      'Field': 'has3DScan',
      'Description': 'Tiene escaneo 3D (true/false)',
      'Type': 'Boolean',
      'Required': 'Yes',
      'Example': 'false'
    },
    {
      'Field': 'surface_finalScore',
      'Description': 'Puntuación final de superficie (0-10)',
      'Type': 'Number',
      'Required': 'Yes',
      'Example': '9.0'
    },
    {
      'Field': 'surface_bent',
      'Description': 'Puntuación de dobleces (0-10, puede ser null)',
      'Type': 'Number',
      'Required': 'No',
      'Example': '10'
    },
    {
      'Field': 'surface_bentWeight',
      'Description': 'Peso de dobleces (0-1, puede ser null)',
      'Type': 'Number',
      'Required': 'No',
      'Example': '0.2'
    },
    {
      'Field': 'surface_front_color',
      'Description': 'Color frontal (0-10)',
      'Type': 'Number',
      'Required': 'Yes',
      'Example': '9.5'
    },
    {
      'Field': 'surface_front_scratches',
      'Description': 'Rayones frontales (0-10)',
      'Type': 'Number',
      'Required': 'Yes',
      'Example': '8.5'
    },
    {
      'Field': 'edges_finalScore',
      'Description': 'Puntuación final de bordes (0-10)',
      'Type': 'Number',
      'Required': 'Yes',
      'Example': '9.5'
    },
    {
      'Field': 'corners_finalScore',
      'Description': 'Puntuación final de esquinas (0-10)',
      'Type': 'Number',
      'Required': 'Yes',
      'Example': '10'
    },
    {
      'Field': 'centering_finalScore',
      'Description': 'Puntuación final de centrado (0-10)',
      'Type': 'Number',
      'Required': 'Yes',
      'Example': '9.0'
    }
  ];
  
  const instructionsWs = XLSX.utils.json_to_sheet(instructions);
  XLSX.utils.book_append_sheet(wb, instructionsWs, 'Instructions');
  
  // Write the file
  const fileName = 'card_import_template.xlsx';
  XLSX.writeFile(wb, fileName);
  
  console.log(`Excel template created: ${fileName}`);
  return fileName;
}

// Execute the function
createCardTemplate();