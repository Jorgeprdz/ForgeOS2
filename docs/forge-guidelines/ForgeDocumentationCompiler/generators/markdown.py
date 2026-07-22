from pathlib import Path

root = Path(__file__).resolve().parent.parent
docs = root / "output" / "docs"
docs.mkdir(parents=True, exist_ok=True)

index = docs / "INDEX.md"

index.write_text("""# Forge Design System

Generated automatically.

## Output

- Tokens
- Components
- Rules
- Patterns

""", encoding="utf-8")

print("Markdown generated.")
