"""`python -m pawatch ifs registry|collect|shares` (sem LLM; por isso não abre trace)."""

from . import log

SOURCES = ("ifdata", "estban", "km1", "ipe")


def add_parser(sub):
    p = sub.add_parser("ifs", help="instituições financeiras: cadastro mestre, coletores (IF.data, ESTBAN, Pilar 3 KM1, "
                                   "CVM IPE) e participação de mercado em data/ifs/")
    p.add_argument("action", choices=["registry", "collect", "shares"])
    p.add_argument("--since", help="AAAA-MM: primeira data-base/mês a coletar (padrão: config/ifs/*.json)")
    p.add_argument("--source", help=f"só estas fontes, separadas por vírgula ({', '.join(SOURCES)}); padrão: todas")
    p.add_argument("--refresh", action="store_true", help="baixa de novo o que já está no cache local")
    p.add_argument("--reparse", action="store_true", help="IF.data e ESTBAN: reextrai do cache local (sem rede)")
    p.set_defaults(fn=run)


def run(args):
    from . import estban, ifdata, ipe, pillar3, registry, shares
    if args.action == "registry":
        registry.build(refresh=args.refresh, log=log)
        return 0
    if args.action == "shares":
        shares.run(log=log)
        return 0
    wanted = [s.strip() for s in (args.source or ",".join(SOURCES)).split(",") if s.strip()]
    bad = [s for s in wanted if s not in SOURCES]
    if bad:
        log(f"fonte desconhecida: {bad} (use {', '.join(SOURCES)})")
        return 2
    failed = []
    for src in wanted:
        try:
            if src == "ifdata":
                ifdata.collect(since=args.since, refresh=args.refresh, reparse=args.reparse, log=log)
            elif src == "estban":
                estban.collect(since=args.since, refresh=args.refresh, reparse=args.reparse, log=log)
            elif src == "km1":
                pillar3.collect(registry.load(), refresh=args.refresh, log=log)
            elif src == "ipe":
                ipe.collect(registry.load(), since=args.since, refresh=args.refresh, log=log)
        except (RuntimeError, OSError) as e:  # uma fonte fora do ar não derruba as outras
            log(f"[{src}] falhou: {e}")
            failed.append(src)
    return 1 if failed else 0
