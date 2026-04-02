#!/usr/bin/env python3
import os, re, sys
ROOT = os.path.join(os.path.dirname(__file__), "src")
pairs = [
    ("text-slate-900", "text-[var(--text-primary)]"),
    ("text-slate-600", "text-[var(--text-secondary)]"),
    ("text-slate-500", "text-[var(--text-secondary)]"),
    ("text-slate-400", "text-[var(--text-muted)]"),
    ("text-slate-100", "text-[var(--bg-card)]"),
    ("bg-slate-50", "bg-[var(--bg-secondary)]"),
    ("bg-slate-100", "bg-[var(--bg-card)]"),
    ("border-slate-200", "border-[var(--border)]"),
    ("border-slate-300", "border-[var(--border-hover)]"),
    ("hover:bg-slate-50", "hover:bg-[var(--bg-card)]"),
    ("hover:text-slate-900", "hover:text-[var(--text-primary)]"),
    ("bg-white ", "bg-[var(--bg-primary)] "),
    ("bg-white\"", "bg-[var(--bg-primary)]\""),
    ("text-cyan-600", "text-[var(--text-primary)]"),
    ("hover:text-cyan-600", "hover:text-[var(--text-primary)]"),
    ("hover:text-cyan-500", "hover:opacity-80"),
    ("text-amber-600", "text-[var(--text-primary)]"),
    ("border-cyan-500/30", "border-[var(--border)]"),
    ("bg-cyan-600", "bg-[var(--text-primary)]"),
    ("hover:bg-cyan-500", "hover:opacity-90"),
    ("text-green-600", "text-green-600"),
]
for dirpath, _, files in os.walk(ROOT):
    for fn in files:
        if not fn.endswith(".tsx"): continue
        p = os.path.join(dirpath, fn)
        with open(p) as f: s = f.read()
        o = s
        for a, b in pairs:
            if a != b: s = s.replace(a, b)
        s = re.sub(r"bg-gradient-to-[a-z]+ from-[^\s]+(?: via-[^\s]+)? to-[^\s]+", "bg-[var(--bg-primary)]", s)
        if s != o:
            with open(p, "w") as f: f.write(s)
            print(p)
