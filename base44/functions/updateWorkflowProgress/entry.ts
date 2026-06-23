import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const PHASES = [
  { number: 1, stages: [1,2,3,4,5,6] },
  { number: 2, stages: [7,8] },
  { number: 3, stages: [9,10] },
  { number: 4, stages: [11] },
  { number: 5, stages: [12,13] },
  { number: 6, stages: [14] },
  { number: 7, stages: [15] },
];

// Maps active workflow stage to the simplified lifecycle status.
// Stages 1-8 = Product Development + Marketing/Launching (Phases 1-2) = draft
//   Package stays draft until BOTH Phase 1 (Product Dev) AND Phase 2 (Marketing) are complete
// Stages 9-11 = Sales + Documentation (Phases 3-4) = active
//   Package auto-activates once Marketing completes its rollout checklist and approves for Sales
// Stages 12-13 = departure confirmed / travel active = confirmed_departure / ongoing
// Stages 14-15 = post-travel = completed
const STAGE_TO_STATUS = {
  1: 'draft', 2: 'draft', 3: 'draft', 4: 'draft', 5: 'draft', 6: 'draft',
  7: 'draft', 8: 'draft',
  9: 'active', 10: 'active', 11: 'active',
  12: 'confirmed_departure', 13: 'ongoing',
  14: 'completed', 15: 'completed',
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const body = await req.json();
    // Support both direct calls and entity automation payloads
    const collective_id = body.collective_id || body.event?.entity_id || body.data?.id;
    if (!collective_id) {
      return Response.json({ error: 'collective_id is required' }, { status: 400 });
    }

    const allTasks = await base44.asServiceRole.entities.ChecklistTask.filter({ collective_id });
    if (allTasks.length === 0) {
      return Response.json({ message: 'No tasks found', collective_id });
    }

    const completedCount = allTasks.filter(t => t.status === 'completed').length;
    const completionPct = Math.round((completedCount / allTasks.length) * 100);

    // Determine current active phase and stage
    let activePhase = 1;
    let activeStage = 1;

    for (const phase of PHASES) {
      const phaseTasks = allTasks.filter(t => t.phase_number === phase.number);
      const phaseComplete = phaseTasks.length > 0 && phaseTasks.every(t => t.status === 'completed');
      if (!phaseComplete) {
        activePhase = phase.number;
        // Find the first incomplete stage in this phase
        for (const stageNum of phase.stages) {
          const stageTasks = allTasks.filter(t => t.stage_number === stageNum);
          const stageComplete = stageTasks.length > 0 && stageTasks.every(t => t.status === 'completed');
          if (!stageComplete) {
            activeStage = stageNum;
            break;
          }
        }
        break;
      }
      // All phases complete
      activePhase = phase.number;
      activeStage = phase.stages[phase.stages.length - 1];
    }

    // Determine collective status based on active stage
    const newStatus = completionPct === 100 ? 'completed' : (STAGE_TO_STATUS[activeStage] || 'draft');

    await base44.asServiceRole.entities.Collective.update(collective_id, {
      current_phase: activePhase,
      current_stage: activeStage,
      checklist_completion: completionPct,
      status: newStatus,
    });

    return Response.json({
      success: true,
      collective_id,
      active_phase: activePhase,
      active_stage: activeStage,
      completion_pct: completionPct,
      new_status: newStatus,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});