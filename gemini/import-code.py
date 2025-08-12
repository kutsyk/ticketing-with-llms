import os
import re
import sys

def create_files_from_markdown(markdown_content):
    """
    Parses markdown content for a specific file pattern and creates files on disk.

    The pattern is:
    ### `<file-path>/<full-file-name>`
    ```<file-type>
    <file-content>
    ```
    -----
    
    Args:
        markdown_content (str): A string containing the markdown with file patterns.
    """
    # Corrected regex to find the entire block for a single file.
    # It now correctly captures the file path between backticks.
    pattern = re.compile(
        r"###\s*`([^`]+)`\n+```[^\n]*\n(.*?)\n```\s*\n-*",
        re.DOTALL
    )

    matches = pattern.finditer(markdown_content)

    if not matches:
        print("No file patterns found in the provided markdown content.")
        return

    for match in matches:
        file_path_full = match.group(1).strip()
        file_content = match.group(2).strip()

        # Extract directory path and filename
        dir_path = os.path.dirname(file_path_full)
        file_name = os.path.basename(file_path_full)

        # Create directories if they don't exist
        if dir_path:
            os.makedirs(dir_path, exist_ok=True)
            print(f"Directory created: {dir_path}")

        # Create or replace the file
        full_file_path = os.path.join(dir_path, file_name)
        try:
            with open(full_file_path, 'w', encoding='utf-8') as f:
                f.write(file_content)
            print(f"File created or replaced: {full_file_path}")
        except IOError as e:
            print(f"Error writing to file {full_file_path}: {e}")

if __name__ == '__main__':
    # Check if a filename was provided as a command-line argument
    if len(sys.argv) < 2:
        print("Usage: python create_files.py <path_to_markdown_file>")
        sys.exit(1)

    markdown_file_path = sys.argv[1]

    # Read the markdown file content
    try:
        with open(markdown_file_path, 'r', encoding='utf-8') as file:
            file_content = file.read()
    except FileNotFoundError:
        print(f"Error: The file '{markdown_file_path}' was not found.")
        sys.exit(1)
    except Exception as e:
        print(f"An error occurred while reading the file: {e}")
        sys.exit(1)

    # Process the file content and create the files
    create_files_from_markdown(file_content)