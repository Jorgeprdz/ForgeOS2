# Stage generators

Each apply-capable stage must provide:

`tools/termux/rewrite/generators/SG-NNN.sh`

The generator receives `FORGE_ROOT` and `FORGE_STAGE` and must create every non-evidence file listed in the stage manifest. The stage runner now fails closed when the generator or any declared output is missing.
