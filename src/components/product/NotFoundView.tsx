import { ArrowLeft, MapTrifold } from "@phosphor-icons/react";
import { ProductShell } from "./ProductShell";

export function NotFoundView() {
  return (
    <ProductShell eyebrow="404" title="This route has no game.">
      <section className="rizz-empty-state">
        <MapTrifold size={48} weight="duotone" />
        <p>
          You found a page that does not exist. The curriculum is still exactly
          where we left it.
        </p>
        <a className="rizz-primary-button" href="/practice">
          <ArrowLeft size={18} />
          Back to practice
        </a>
      </section>
    </ProductShell>
  );
}
