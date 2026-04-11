# WIKA Stage28 Task 3-5 Workbench

## Status
- stage28 workbench layer currently reaches local contract only.
- No route in this document is deployed in this round.

## Candidate routes
- `/integrations/alibaba/wika/workbench/product-draft-workbench`
- `/integrations/alibaba/wika/workbench/reply-workbench`
- `/integrations/alibaba/wika/workbench/order-workbench`
- `/integrations/alibaba/wika/workbench/task-workbench`

## Task 3 product draft workbench
- scope:
  - safe draft preparation only
  - schema-aware read-side preparation
  - media and schema context exposure
- output sections:
  - `product_context`
  - `schema_context`
  - `media_context`
  - `draft_readiness`
  - `required_manual_fields`
  - `blocking_risks`
  - `recommended_next_action`
- boundary:
  - not platform publish
  - not write-side closed loop

## Task 4 reply workbench
- scope:
  - external reply draft workflow only
  - blocker taxonomy summary only
  - handoff pack readiness only
- output sections:
  - `workflow_capability`
  - `input_requirements`
  - `current_reply_profiles`
  - `blocker_taxonomy_summary`
  - `handoff_pack_capability`
  - `quality_gate_summary`
  - `sample_availability`
  - `boundary_statement`
- boundary:
  - not platform reply
  - no real send attempted

## Task 5 order workbench
- scope:
  - external order draft workflow only
  - manual field system only
  - handoff pack readiness only
- output sections:
  - `workflow_capability`
  - `input_requirements`
  - `current_order_profiles`
  - `required_manual_field_system`
  - `handoff_pack_capability`
  - `quality_gate_summary`
  - `sample_availability`
  - `blocker_taxonomy_summary`
  - `boundary_statement`
- boundary:
  - not platform order create
  - no real order creation attempted

## Combined task workbench
- `task-workbench` aggregates:
  - `task3_summary`
  - `task4_summary`
  - `task5_summary`
  - `shared_blockers`
  - `shared_handoff_rules`
  - `boundary_statement`

## Global boundary
- not task 3 complete
- not task 4 complete
- not task 5 complete
- task 6 excluded
- no write action attempted

## 2026-04-11 Stage 28 Deploy Lock

### deployed routes
- `/integrations/alibaba/wika/workbench/product-draft-workbench`
- `/integrations/alibaba/wika/workbench/reply-workbench`
- `/integrations/alibaba/wika/workbench/order-workbench`
- `/integrations/alibaba/wika/workbench/task-workbench`

### production status
- all four workbench routes passed production smoke with `200 + JSON`

### fixed boundary
- task3 stays safe draft preparation only
- task4 stays external reply draft only
- task5 stays external order draft only
- task3/4/5 workbench is not platform-internal execution
- task6 stays excluded
