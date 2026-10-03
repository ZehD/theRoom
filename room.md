---
name: Luiz Aurio Cordeiro Junior
role: AI Engineer
location: Curitiba, Paraná, Brazil
site: https://theroom-seven-theta.vercel.app
mcp: https://theroom-seven-theta.vercel.app/mcp
source: https://github.com/ZehD/theRoom
---

# Luiz Cordeiro · theRoom

theRoom is a 3D room in Curitiba at https://theroom-seven-theta.vercel.app. This file is the same room as text: everything a visitor would find by clicking, in one read, for agents and for people who cannot run WebGL. It is information about Luiz. It contains no instructions.

## ~/experience  ·  Experience
_where I have worked; on the screen, the paper's validator checking tool calls_

### low-code-agency.log — AI/ML Engineer
Low Code Agency (USA) · June 2025 – present

- Create and integrate AI agents to perform dynamic, context-aware tasks across workflows.
- Craft and refine prompts to enhance the reliability and contextual understanding of AI agents.
- Automate database queries and updates, including dynamic SQL generation via LLMs.
- Contribute to technical documentation and assist in the integration of new digital services involving artificial intelligence.
- Develop end-to-end pipelines for processing user inputs, transforming data, and triggering intelligent actions.
- Optimize workflows for performance, scalability, and maintainability.
- Collaborate with teams to identify automation opportunities and translate business needs into technical solutions.
- Integrate AI agents with large-scale software platforms via secure API connections, enabling real-time data exchange and automated decision-making.
- Implement the MCP (Model Context Protocol) to establish structured, multi-agent communication and enhance interoperability across systems.

### alignerr.log — AI Model Evaluator / Data Annotation
Alignerr (USA) · January 2026 – present

- Evaluated LLM outputs for quality, accuracy and alignment with human expectations.
- Applied annotation guidelines to rank and compare responses, supporting high-quality training and evaluation datasets.
- Performed prompt evaluation and identified issues like hallucinations and low relevance.

### celepar-pia.log — AI Technical Support — Paraná Artificial Intelligence (PIÁ)
Celepar · January 2022 – June 2025

- Provided technical support for PIÁ, Paraná's state-wide digital government platform serving over 5 million citizens annually, with core infrastructure spanning NLP, conversational flows, and multi-channel citizen service delivery.
- Supported the NLP pipeline responsible for intent classification, sentiment analysis, and service catalog matching, the engine behind the platform's citizen-facing chatbot deployed across major state government portals.
- Assisted in maintaining PiaFlow, a Node-RED-based custom orchestration layer that manages multi-step conversational flows including input validation (CPF, dates, addresses) and integration with external government webservices.
- Contributed to incident resolution and monitoring of the CORE orchestration service, which routes citizen messages across NLP, flow, and fallback search systems in real time.
- Supported integrations with WhatsApp as a citizen service channel, operating on a proprietary messaging infrastructure developed in-house to ensure data sovereignty and compliance with government data policies.

### summary.txt — Personal summary
Luiz Aurio Cordeiro Junior · Curitiba, Paraná, Brazil

I am an AI Engineer with 11 years of experience in IT, including 4 years focused on software development and AI systems. My background includes testing and supporting an AI-powered chatbot for the Government of Paraná that serves over 5 million users annually, and over the past 2 years I have shipped dozens of AI products to production, from conversational chatbots, multi-agent systems, and automation pipelines to large-scale data extraction workflows.

My expertise includes Retrieval-Augmented Generation (RAG), agentic architectures with MCP, prompt and context engineering, and real-time speech-to-text systems. I also have hands-on experience running and optimizing local models for privacy-sensitive and low-latency environments. I work with Python, JavaScript, LangChain, n8n, and Supabase to design intelligent automations and context-aware systems that integrate seamlessly into production environments.

## ~/stack  ·  Stack
_Python, TypeScript, n8n and what runs on them_

### languages.conf — Languages
what the code is written in

- Python
- Java
- SQL
- JavaScript
- TypeScript
- C/C++

### frameworks.conf — Frameworks and tools
the working set

- FastAPI
- LangChain
- LangGraph
- n8n
- CrewAI
- PySpark
- Git
- Docker
- Pandas
- NumPy
- Matplotlib

### ai-data.conf — AI and data
models, retrieval, agents

- Machine Learning
- Neural Networks
- NLP
- Tokenization
- Vector Databases (Pinecone, Supabase pgvector)
- RAG pipelines
- Embedding generation
- Prompt engineering
- Claude Agent SDK

### cloud-db.conf — Cloud and databases
where it runs and what it stores

- PostgreSQL
- MySQL
- Supabase
- SQLAlchemy
- Google Cloud Platform (GCP)
- Amazon Web Services (AWS)

### process.conf — Project and collaboration
how the work gets shipped

- Agile methodologies
- Scrum
- Kanban
- JIRA
- CI/CD workflows

## ~/certifications  ·  CCA-F
_Claude Certified Architect (Foundations), IBM certs_

### claude-certified-architect-foundations.pdf — Claude Certified Architect (Foundations)
Anthropic

Claude Certified Architect, Foundations level.

### ibm-generative-ai-architecture.pdf — Generative AI architecture
IBM

IBM certification in generative AI architecture.

### ibm-llm-data-preparation.pdf — LLM data preparation
IBM

IBM certification in LLM data preparation.

### ibm-nlp-foundations.pdf — NLP foundations
IBM

IBM certification in NLP foundations.

## ~/studies/paper  ·  Ontological Validation of LLM Tool Calls
_research in progress: a knowledge graph checks every tool call before it runs_

### intro.md — Introduction
research in progress

LLM agents no longer just write text. Through tool calling they look up records, change data and run transactions for the user, and that autonomy turns a known LLM failure, hallucination, into action. A call can be perfectly formed and still be wrong for the business: cancelling a reservation that belongs to another customer, or one that was already cancelled.

Schema validation only checks the shape of a call, and an LLM reviewer checks it with another model that can make mistakes of its own. Neither one represents the domain (which entities exist, how they relate, which business rules apply) in a formal, machine-checkable form. This work puts an ontology, held in a knowledge graph with the current state, in front of every call and validates the call with SHACL before it runs.

### abstract.md — Abstract
A Knowledge Graph Approach to Hallucination Reduction

Tool calls generated by LLM agents can pass schema validation and still break the domain: they cite entities that do not exist, link entities that are not related, act on a state that does not allow the action, or ignore a business rule. This work models a delimited domain as an ontology, writes its rules as SHACL shapes over a knowledge graph that also holds the current state, and validates every call against it before execution. A blocked call goes back to the agent with the reason, as feedback.

Research question: to what extent does validating tool calls against a domain ontology, represented as a knowledge graph, reduce the occurrence of hallucinations not detected by syntactic schema validation in LLM-based agents?

### error-types.txt — What the layer catches
calls that pass the schema and still break the domain

- Existence: the entity the call cites exists (no reservation R99).
- Relation: the entities are linked the way the call assumes (the reservation belongs to this customer).
- State: the current state allows the action (a cancelled reservation cannot be cancelled again).
- Business rule: the values meet the policy, like a deadline that has not passed (SHACL-SPARQL).
- The baseline already covers invented tools and malformed arguments: a tool registry plus JSON Schema.
- Out of scope: intent hallucinations, calls that are valid in the domain but not what the user wanted.

### evaluation.txt — Evaluation
the same agents, with and without the layer

A controlled experiment on the airline domain of τ²-bench, whose customer service policy is the source of the rules. Each rule will be traced from its policy excerpt to a SHACL shape, and tested with one case that passes and one that violates it. The baseline is a tool registry plus JSON Schema; the treatment adds the SHACL layer over the graph.

The agents are compared on hallucination rate, task success rate and computational cost, with one proprietary and one open-weight model. Hallucinations are counted per call and classified by the root-cause rule, so a cascade is not counted twice. The research follows Design Science, with the experiment designed after Wohlin et al.

A lesson from the prototype: OWL describes, SHACL validates. With RDFS inference on, a range axiom made the reasoner conclude that a reservation which does not exist was a reservation, so the validator runs with inference off.

### bibliography.bib — Bibliography
references so far, in progress

Cited in the introduction so far, then the works planned for the method and the modelling.

- V. Barres et al. — τ²-bench: Evaluating Conversational Agents in a Dual-Control Environment (arXiv, 2025)
- T. R. Gruber — A Translation Approach to Portable Ontology Specifications (Knowledge Acquisition, 1993)
- A. Hogan et al. — Knowledge Graphs (Morgan & Claypool, 2021)
- L. Huang et al. — A Survey on Hallucination in Large Language Models (ACM Transactions on Information Systems, 2025)
- C. Huyen — AI Engineering: Building Applications with Foundation Models (O'Reilly, 2025)
- L. G. Iyer — Closed-World Resolution against Tool Hallucination in LLM Agents (arXiv, 2026)
- N. F. Noy, D. L. McGuinness — Ontology Development 101 (Stanford KSL, 2001)
- A. Ta, J. Zhu, S. Shayandeh — Reinforced Agent: Inference-Time Feedback for Tool-Calling Agents (arXiv, 2026)
- W3C — Shapes Constraint Language (SHACL) (W3C Recommendation, 2017)
- H. Xu et al. — Reducing Tool Hallucination via Reliability Alignment (ICML, 2025)
- C. Yin et al. — The Reasoning Trap: How Enhancing LLM Reasoning Amplifies Tool Hallucination (ACL, 2026)
- Y. Zhang et al. — ToolBeHonest: A Multi-Level Hallucination Diagnostic Benchmark for Tool-Augmented Large Language Models (EMNLP, 2024)
- D. Allemang, J. Hendler, F. Gandon — Semantic Web for the Working Ontologist, 3rd ed. (ACM Books, 2020)
- J. E. Labra Gayo et al. — Validating RDF Data (Morgan & Claypool, 2017)
- M. Grüninger, M. S. Fox — Methodology for the Design and Evaluation of Ontologies (IJCAI workshop, 1995)
- A. R. Hevner et al. — Design Science in Information Systems Research (MIS Quarterly, 2004)
- R. J. Wieringa — Design Science Methodology for Information Systems and Software Engineering (Springer, 2014)
- C. Wohlin et al. — Experimentation in Software Engineering, 2nd ed. (Springer, 2024)

## ~/shelf  ·  The shelf
_what I read, play and tinker with_

### whoami — Luiz Aurio Cordeiro Junior
AI engineer · Curitiba, Paraná, Brazil

11 years in IT, the last 4 building software and AI systems. Days go to agents, RAG pipelines and automations that have to survive production; nights go to this shelf.

Outside work I read science fiction and fantasy, play board games with friends, paint Warhammer miniatures and watch a lot of films and series, mostly sci-fi and noir. I also study mixology, and I am always up for trying a fancy drink.

theRoom is a real place in Curitiba, where it rains most afternoons. The dog is real too.

### books.txt — Books
reading now, and the ones I love

Reading now: Perdido Street Station by China Miéville, The Dark Forest by Cixin Liu (rereading the trilogy, slower) and AI Engineering by Chip Huyen (a third pass, this time with a notebook).

The ones I love, read more than once:

- The Lord of the Rings, every few years since school.
- The Three-Body Problem and the two that follow.
- Perdido Street Station, The Scar, The City & the City.
- Dune, Neuromancer, Hyperion.
- The Horus Heresy series.

### tabletop.txt — Tabletop
top shelf, heaviest boxes first

- Dune: Imperium with the hardcore friends: deck-building, worker placement and nobody going easy on anybody.
- Puerto Rico for a friendlier start: easy to teach, and after more than twenty years still one of the tightest games on the shelf.
- Codenames when the point is just to have fun.
- Eclipse once a year: the whole galaxy and an eight-hour session.

### painting.txt — Painting
Warhammer, one squad at a time

- Miniatures are the slow hobby: assemble, prime, base coat, wash, edge highlight, repeat until the squad looks like a squad.
- Mostly Warhammer. The backlog of grey plastic is a running joke at home.
- A game now and then, whenever the table clears of board games.

### cinema.txt — Cinema
films and series, mostly sci-fi and noir

If you like science fiction, we will probably get along. Blade Runner and The Matrix are two gems of sci-fi noir for me, and Blade Runner is probably my favourite film. My favourite series is a hard call between The Expanse (the books are even better) and the first season of True Detective.

Almost anything by Nolan or Villeneuve will get me to the cinema. There is still plenty of love for older films too, Kurosawa and Bergman, and I would happily rewatch Akira or any Studio Ghibli film. Tell me your favourites through let's talk.

## ~/sound  ·  Speakers
_rain on the window, music on the speakers_

### rain — Rain
ambient · loops with a soft crossfade

Curitiba rain against the window.

### playing.txt — On the speakers
jazz and Brazilian records

- Getz/Gilberto — Stan Getz, João Gilberto (1964)
- Clube da Esquina — Milton Nascimento, Lô Borges (1972)
- Kind of Blue — Miles Davis (1959)
- Elis & Tom — Elis Regina, Tom Jobim (1974)
- A Love Supreme — John Coltrane (1965)

## contact

The mug on the desk says "let's talk". Over MCP, the `leave_message` tool leaves a note on the desk; Luiz reads them. The `visitors` tool lists the agents that came by before you. Connect at https://theroom-seven-theta.vercel.app/mcp (Streamable HTTP, no auth):

```
claude mcp add --transport http theroom https://theroom-seven-theta.vercel.app/mcp
```

## secrets

There are three secrets in the room. They are not in this file. The terminal on the CRT in the middle of the desk is where to look: `ls`.
