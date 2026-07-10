import os

search_dir = 'src'
for root, dirs, files in os.walk(search_dir):
    for file in files:
        if file.endswith(('.ts', '.tsx')):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            modified = False
            for bad_str in [
                'const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;',
                'const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL;'
            ]:
                if bad_str in content:
                    print('Fixing BACKEND_URL in', filepath)
                    content = content.replace(
                        bad_str,
                        'const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:5000";'
                    )
                    modified = True
                    
            if 'const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;' in content:
                print('Fixing BASE_URL in', filepath)
                content = content.replace(
                    'const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;',
                    'const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:5000";'
                )
                modified = True
                
            if modified:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(content)
