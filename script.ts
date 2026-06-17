import * as fs from 'fs';
import * as path from 'path';

const files_to_process = [
    'src/pages/ProductDetail.tsx',
    'src/pages/Checkout.tsx',
    'src/pages/TrackOrder.tsx',
    'src/pages/Home.tsx',
    'src/pages/About.tsx',
    'src/pages/Gallery.tsx',
    'src/pages/Admin.tsx',
    'src/pages/ModernHome.tsx',
    'src/pages/Shop.tsx',
    'src/pages/OrderHistory.tsx',
    'src/components/ImageUpload.tsx',
    'src/components/Layout.tsx',
];

files_to_process.forEach(filepath => {
    if (!fs.existsSync(filepath)) return;
    
    const content = fs.readFileSync(filepath, 'utf8');
    
    // Replace <img with <StorageImage
    let new_content = content.replace(/<img\b/g, '<StorageImage');
    
    // Avoid double import
    if (new_content !== content && !new_content.includes('import StorageImage')) {
        const importStr = filepath.startsWith('src/components/') ? 
            "import StorageImage from './StorageImage';\n" : 
            "import StorageImage from '../components/StorageImage';\n";
            
        // Find last import statement
        const lastImportIndex = new_content.lastIndexOf('import ');
        if (lastImportIndex !== -1) {
            const endOfLine = new_content.indexOf('\n', lastImportIndex);
            new_content = new_content.substring(0, endOfLine + 1) + importStr + new_content.substring(endOfLine + 1);
        } else {
            new_content = importStr + new_content;
        }
        
        fs.writeFileSync(filepath, new_content, 'utf8');
        console.log(`Updated ${filepath}`);
    }
});
