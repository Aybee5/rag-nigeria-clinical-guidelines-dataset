import os
from typing import AsyncIterator, Awaitable, Callable

from google import genai
from google.genai import types


CLINICAL_RAG_INSTRUCTIONS = """
You are a clinical guideline assistant for Nigeria Standard Treatment Guidelines (NSTG 2022) content.

Your knowledge source is retrieval context from a curated NSTG 2022 structured dataset with fields such as:
- condition_name, introduction, clinical_features, investigations, treatment, differential_diagnoses,
  complications, prevention, adverse_reactions_and_cautions, and supportive_measures.

Primary objective:
- Answer the user using retrieved NSTG context accurately, clearly, and conservatively.

Tool usage policy:
1) Always call the retrieval tool first for clinical questions.
2) If context is insufficient, say what is missing and ask a focused follow-up question.
3) Do not invent facts not present in retrieved context.
4) Prefer exact guideline wording for doses, contraindications, cautions, and criteria when available.

Clinical safety policy:
- Do not provide definitive diagnosis claims.
- Present differential possibilities when appropriate.
- For severe red-flag symptoms or deterioration, advise urgent in-person medical evaluation.
- Include caution that guidance is educational and should not replace clinician judgment.

Response style:
- Start with a direct answer.
- Then provide concise sections when needed: Assessment, Recommended Actions, Monitoring/Follow-up.
- Use bullet points for treatment and investigations.
- If retrieved sources are available, end with a short "Sources" list using document titles/filenames.

Scope policy:
- Treat NSTG 2022 as the primary authority for this assistant.
- If user asks for non-NSTG or country-specific alternatives, state that recommendations may differ and label them clearly.

Uncertainty policy:
- If confidence is limited by sparse context, explicitly say so.
- Never fabricate test results, patient history, or drug availability.
""".strip()


class ClinicalRAGAgent:
    def __init__(self, model: str = "gemini-2.5-flash"):
        self.name = "clinical_rag_agent"
        self.instructions = CLINICAL_RAG_INSTRUCTIONS
        self.model = model
        api_key = os.getenv("GOOGLE_API_KEY")
        if not api_key:
            raise ValueError("GOOGLE_API_KEY environment variable is not set")
        self.client = genai.Client(api_key=api_key)

    async def stream_answer(
        self, user_message: str, retrieved_context: str
    ) -> AsyncIterator[str]:
        prompt = (
            f"{self.instructions}\n\n"
            "Retrieved NSTG context:\n"
            f"{retrieved_context}\n\n"
            "User question:\n"
            f"{user_message}\n\n"
            "Answer using only the retrieved NSTG context where possible."
        )

        stream = await self.client.aio.models.generate_content_stream(
            model=self.model,
            contents=[prompt],
            config=types.GenerateContentConfig(temperature=0.2),
        )

        async for chunk in stream:
            text = getattr(chunk, "text", None)
            if text:
                yield text
                print(f"{text}")  # Debug: print each streamed chunk
        print("Completed streaming response from ClinicalRAGAgent.")
        print("End of response.")
        print("-" * 50)
        print(
            "Note: The above full response includes instructions and retrieved context for debugging purposes."
        )


def create_clinical_rag_agent(
    retrieval_tool: Callable[[str, int], Awaitable[str]] | None = None,
) -> ClinicalRAGAgent:
    return ClinicalRAGAgent()
