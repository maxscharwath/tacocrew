#!/usr/bin/env python3
import re
import sys

def hex_to_decimal(match):
    hex_str = match.group(0)
    if hex_str.startswith('0x'):
        return str(int(hex_str, 16))
    return hex_str

def deobfuscate_file(content):
    # Convert hex numbers to decimal
    content = re.sub(r'0x[0-9a-fA-F]+', hex_to_decimal, content)
    
    # Replace bracket notation with dot notation for common patterns
    # document["querySelector"] -> document.querySelector
    content = re.sub(r'(\w+)\["([^"]+)"\]', r'\1.\2', content)
    content = re.sub(r"(\w+)\['([^']+)'\]", r"\1.\2", content)
    
    # Fix some edge cases
    content = content.replace('document.querySelector', 'document.querySelector')
    content = content.replace('window.addEventListener', 'window.addEventListener')
    
    return content

if __name__ == '__main__':
    with open('/workspace/bundle.js', 'r') as f:
        content = f.read()
    
    # First pass: convert hex to decimal
    content = re.sub(r'0x[0-9a-fA-F]+', hex_to_decimal, content)
    
    # Write intermediate result
    with open('/workspace/bundle_intermediate.js', 'w') as f:
        f.write(content)
    
    print("Step 1: Converted hex numbers to decimal")
