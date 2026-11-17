"""A LangChain call to a build.nvidia.com NIM model, routed through the NeMo Relay gateway.

Relay's gateway sits between the app and NVIDIA's OpenAI-compatible endpoint, so
the `silvanexum` plugin (see plugins.toml) meters the call and, with
`enforce_budget = true`, rejects it before it runs when the budget is exhausted.
No plugin-specific code is needed in the app: only the base URL changes.

Prereqs (see README.md for the plugin install):
    pip install langchain-openai
    export NVIDIA_API_KEY="nvapi-..."   # build.nvidia.com
    nemo-relay --openai-base-url https://integrate.api.nvidia.com/v1   # gateway on 127.0.0.1:4040
"""
from __future__ import annotations

import os


def main() -> None:
    # Imported lazily so the file is importable without the extra deps installed.
    from langchain_openai import ChatOpenAI

    llm = ChatOpenAI(
        base_url=os.environ.get("RELAY_GATEWAY_URL", "http://127.0.0.1:4040/v1"),
        api_key=os.environ["NVIDIA_API_KEY"],
        model="nvidia/nemotron-3-super-120b-a12b",  # hosted NIM -> Silvanexum provider "nvidia"
        # Per-call attribution: billed to, and budget-checked against, this customer.
        default_headers={"x-silvanexum-customer": "acme-inc"},
    )
    reply = llm.invoke("Give me one fact about the Hopper GPU.")
    print(reply.content)


if __name__ == "__main__":
    main()
