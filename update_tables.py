import os
import glob
import re

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content

    # Remove whitespace-nowrap and min-w-[...] from tables
    content = re.sub(r'whitespace-nowrap\s+min-w-\[\d+px\]\s*', '', content)
    content = re.sub(r'min-w-\[\d+px\]\s+whitespace-nowrap\s*', '', content)
    
    # Update paddings
    content = content.replace('px-6 py-4 text-sm', 'px-4 py-3 text-[13px]')
    content = content.replace('px-6 py-4', 'px-4 py-3')
    
    # Update header text sizes
    content = content.replace('text-xs uppercase', 'text-[11px] uppercase')
    
    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {filepath}")

if __name__ == "__main__":
    files = glob.glob('src/app/(dashboard)/**/*.tsx', recursive=True)
    for f in files:
        process_file(f)
