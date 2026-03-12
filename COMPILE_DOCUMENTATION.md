# Compiling the LaTeX Documentation

## Prerequisites

You need a LaTeX distribution installed on your system:

### Windows
- **MiKTeX**: Download from https://miktex.org/download
- **TeX Live**: Download from https://www.tug.org/texlive/

### macOS
- **MacTeX**: Download from https://www.tug.org/mactex/
- Or use Homebrew: `brew install --cask mactex`

### Linux
- **TeX Live**: Install via package manager
  - Ubuntu/Debian: `sudo apt-get install texlive-full`
  - Fedora: `sudo dnf install texlive-scheme-full`

## Compilation Steps

### Using Command Line

1. Navigate to the project directory:
```bash
cd cholera-dashboard
```

2. Compile the LaTeX document:
```bash
pdflatex documentation.tex
pdflatex documentation.tex  # Run twice for references
```

Or use the full compilation with bibliography (if you add one later):
```bash
pdflatex documentation.tex
bibtex documentation
pdflatex documentation.tex
pdflatex documentation.tex
```

### Using LaTeX Editors

#### Overleaf (Online - Recommended for beginners)
1. Go to https://www.overleaf.com/
2. Create a new project
3. Upload `documentation.tex`
4. Click "Recompile" to generate PDF

#### TeXstudio
1. Open `documentation.tex` in TeXstudio
2. Click "Build & View" (F5) or "Build" (F6)

#### VS Code with LaTeX Workshop Extension
1. Install "LaTeX Workshop" extension
2. Open `documentation.tex`
3. Press `Ctrl+Alt+B` (Windows/Linux) or `Cmd+Option+B` (Mac) to build

## Required LaTeX Packages

The document uses these packages (usually included in full LaTeX distributions):
- `inputenc`, `fontenc` - Character encoding
- `geometry` - Page margins
- `graphicx` - Image support
- `hyperref` - Hyperlinks
- `listings` - Code listings
- `xcolor` - Colors
- `amsmath` - Math equations
- `booktabs` - Professional tables
- `float` - Float positioning
- `caption`, `subcaption` - Captions
- `enumitem` - List customization
- `titlesec` - Section formatting

## Output

After successful compilation, you'll get:
- `documentation.pdf` - The compiled PDF document
- `documentation.aux` - Auxiliary file (can be deleted)
- `documentation.log` - Compilation log (can be deleted)
- `documentation.toc` - Table of contents (can be deleted)

## Troubleshooting

### Missing Packages
If you get "Package not found" errors:
- **MiKTeX**: Packages are installed automatically on first use
- **TeX Live**: Install missing packages via package manager

### Compilation Errors
- Check `documentation.log` for detailed error messages
- Ensure all required packages are installed
- Verify LaTeX distribution is properly configured

### Bibliography Issues
If you add citations later:
- Use `\cite{}` commands
- Create a `.bib` file
- Run `bibtex` between `pdflatex` runs

## Customization

To customize the document:
- Edit `documentation.tex` directly
- Modify section content as needed
- Add figures using `\includegraphics{}`
- Add tables using `\begin{table}...\end{table}`

