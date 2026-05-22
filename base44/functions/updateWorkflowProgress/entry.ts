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

const STAGE_TO_STATUS = {
  1: 'product_development', 2: 'for_approval', 3: 'product_development',
  4: 'product_development', 5: 'product_development', 6: 'marketing_prep',
  7: 'launched', 8: 'reservation_ongoing', 9: 'payment_verification',
  10: 'documentation', 11: 'documentation', 12: 'pre_departure',
  13: 'ongoing', 14: 'completed', 15: 'post_evaluation',
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { collective_id } = body;
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
    const newStatus = completionPct === 100 ? 'completed' : (STAGE_TO_STATUS[activeStage] || 'product_development');

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