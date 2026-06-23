import { createClientFromRequest } from 'npm:@base44/sdk@0.8.32';

const PHASES = [
  { number: 1, stages: [1,2,3,4,5,6] },
  { number: 2, stages: [7,8] },
  { number: 3, stages: [9,10] },
  { number: 4, stages: [11] },
  { number: 5, stages: [12,13] },
  { number: 6, stages: [14] },
  { number: 7, stages: [15] },
];

// ── ACTIVATION RULE (per Product Development Manager) ──
// "Active" status requires ONLY Product Development + Marketing task completion.
// Other departments (admin, operations, visa, management, accounting) do NOT block activation.
// Later lifecycle stages (confirmed_departure, ongoing, completed) are checked by stage-level tasks.

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const body = await req.json();
    // Support both direct calls and entity automation payloads
    // For ChecklistTask automations: the collective_id is inside body.data.collective_id
    const collective_id = body.collective_id || body.data?.collective_id || body.event?.entity_id || body.data?.id;
    if (!collective_id) {
      return Response.json({ error: 'collective_id is required' }, { status: 400 });
    }

    const allTasks = await base44.asServiceRole.entities.ChecklistTask.filter({ collective_id });
    if (allTasks.length === 0) {
      console.log('[updateWorkflowProgress] No tasks found for collective:', collective_id);
      return Response.json({ message: 'No tasks found', collective_id });
    }

    const completedCount = allTasks.filter(t => t.status === 'completed').length;
    const completionPct = Math.round((completedCount / allTasks.length) * 100);

    // Track overall phase/stage for Workflow UI (informational — does NOT drive status)
    let activePhase = 1;
    let activeStage = 1;
    for (const phase of PHASES) {
      const phaseTasks = allTasks.filter(t => t.phase_number === phase.number);
      const phaseComplete = phaseTasks.length > 0 && phaseTasks.every(t => t.status === 'completed');
      if (!phaseComplete) {
        activePhase = phase.number;
        for (const stageNum of phase.stages) {
          const stageTasks = allTasks.filter(t => t.stage_number === stageNum);
          if (!(stageTasks.length > 0 && stageTasks.every(t => t.status === 'completed'))) {
            activeStage = stageNum;
            break;
          }
        }
        break;
      }
      activePhase = phase.number;
      activeStage = phase.stages[phase.stages.length - 1];
    }

    // ── DEPARTMENT-BASED ACTIVATION ──
    // Active = Product Development complete AND Marketing complete (ONLY these two departments)
    const productDevTasks = allTasks.filter(t => t.department === 'product_development');
    const marketingTasks = allTasks.filter(t => t.department === 'marketing');
    const productDevComplete = productDevTasks.length > 0 && productDevTasks.every(t => t.status === 'completed');
    const marketingComplete = marketingTasks.length > 0 && marketingTasks.every(t => t.status === 'completed');
    const activationReady = productDevComplete && marketingComplete;

    // Later lifecycle stages (checked by stage-level task completion)
    const departureTasks = allTasks.filter(t => t.stage_number === 12);
    const travelTasks = allTasks.filter(t => t.stage_number === 13);
    const postTravelTasks = allTasks.filter(t => t.stage_number >= 14);
    const departureComplete = departureTasks.length > 0 && departureTasks.every(t => t.status === 'completed');
    const travelComplete = travelTasks.length > 0 && travelTasks.every(t => t.status === 'completed');
    const postTravelComplete = postTravelTasks.length > 0 && postTravelTasks.every(t => t.status === 'completed');

    let newStatus;
    if (completionPct === 100 || postTravelComplete) {
      newStatus = 'completed';
    } else if (travelComplete) {
      newStatus = 'ongoing';
    } else if (departureComplete) {
      newStatus = 'confirmed_departure';
    } else if (activationReady) {
      newStatus = 'active';
    } else {
      newStatus = 'draft';
    }

    console.log('[updateWorkflowProgress] ── ACTIVATION CHECK ──');
    console.log('[updateWorkflowProgress] collective_id:', collective_id);
    console.log('[updateWorkflowProgress] overall completion:', completedCount + '/' + allTasks.length, '=', completionPct + '%');
    console.log('[updateWorkflowProgress] Product Dev:', productDevTasks.filter(t => t.status === 'completed').length + '/' + productDevTasks.length, '→', productDevComplete ? 'COMPLETE' : 'INCOMPLETE');
    console.log('[updateWorkflowProgress] Marketing:', marketingTasks.filter(t => t.status === 'completed').length + '/' + marketingTasks.length, '→', marketingComplete ? 'COMPLETE' : 'INCOMPLETE');
    console.log('[updateWorkflowProgress] activation ready (PD + Marketing):', activationReady);
    console.log('[updateWorkflowProgress] calculated status:', newStatus);

    const currentCollective = await base44.asServiceRole.entities.Collective.get(collective_id);
    console.log('[updateWorkflowProgress] previous status:', currentCollective?.status);

    await base44.asServiceRole.entities.Collective.update(collective_id, {
      current_phase: activePhase,
      current_stage: activeStage,
      checklist_completion: completionPct,
      status: newStatus,
    });

    console.log('[updateWorkflowProgress] saved status:', newStatus);
    if (newStatus === 'active' && currentCollective?.status === 'draft') {
      console.log('[updateWorkflowProgress] ✅ PACKAGE ACTIVATED — moved from draft to active');
    }

    return Response.json({
      success: true,
      collective_id,
      active_phase: activePhase,
      active_stage: activeStage,
      completion_pct: completionPct,
      previous_status: currentCollective?.status,
      new_status: newStatus,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});