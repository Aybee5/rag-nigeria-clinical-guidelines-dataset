# Clinical RAG Agent

Use the reusable clinical agent in [clinical_rag_agent.py](clinical_rag_agent.py).

## What it includes

- `CLINICAL_RAG_INSTRUCTIONS`: domain-specific system instruction for NSTG 2022 clinical RAG.
- `create_clinical_rag_agent(...)`: helper to build a Google GenAI-backed clinical agent.

## Minimal integration

```python
from clinical_rag_agent import create_clinical_rag_agent


async def retrieve_clinical_context(query: str, limit: int = 5) -> str:
	# 1) call your vector search (e.g., retrieve_similar_chunks)
	# 2) fetch chunk texts by top indices
	# 3) return combined context string (optionally with source labels)
	...


agent = create_clinical_rag_agent(retrieve_clinical_context)

context = await retrieve_clinical_context(user_message, limit=5)
async for token in agent.stream_answer(user_message, context):
	print(token, end="")
```

This keeps retrieval-first behavior and streams model output from Gemini.

## Instruction design choices

- Enforces retrieval-first behavior.
- Prevents hallucination outside retrieved context.
- Adds clinical safety guardrails and uncertainty handling.
- Keeps NSTG 2022 as primary authority.
