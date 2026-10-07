import {
  WorkOrder,
  WORKSHOPS,
  EQUIPMENT_LIST,
  EMPLOYEES,
  FAULT_CODES,
  MATERIALS_CATALOG,
  AiEvaluation,
} from './mockData';

export function generateHistoricalOrders(): WorkOrder[] {
  const orders: WorkOrder[] = [];
  const now = new Date('2026-10-06T18:00:00Z').getTime();
  const dayMs = 24 * 60 * 60 * 1000;
  const workers = EMPLOYEES.filter((e) => e.role === 'worker');
  const masters = EMPLOYEES.filter((e) => e.role === 'master');

  let orderCounter = 101;

  const convK3 = EQUIPMENT_LIST.find((e) => e.id === 'eq_conv_k3')!;
  const m02Fault = FAULT_CODES.find((f) => f.code === 'М-02')!;

  for (let i = 1; i <= 7; i++) {
    const daysAgo = 28 - i * 3.8;
    const orderTime = new Date(now - daysAgo * dayMs);
    const fault = i <= 5 ? m02Fault : FAULT_CODES[2];
    const worker = workers[(i * 2) % workers.length];
    const durationHours = 2.8 + (i % 3) * 0.4;
    const completedTime = new Date(orderTime.getTime() + durationHours * 3600 * 1000);

    const evaluation: AiEvaluation = {
      verdict: i === 7 ? 'approved_with_notes' : 'approved',
      score: 84 + (i % 10),
      explanation: `Проведена замена подшипникового узла. ИИ фиксирует повторный отказ по шифру ${fault.code} на данном оборудовании за короткий период.`,
      workDescriptionMatch: true,
      materialLogicCheck: true,
      timeNormMatch: true,
      photoAnalysis: {
        score: 4,
        equipmentMatch: true,
        defectEliminated: true,
        safetyCleanlinessScore: 4,
        notes: 'Подшипник 22320 смонтирован, кожух закреплен.',
      },
      workerFeedback: 'Работа выполнена качественно, но узел работает с повышенной осевой вибрацией.',
      masterNotes: 'Требуется лазерная центровка валов привода.',
    };

    orders.push({
      id: `ord_convk3_${i}`,
      number: `№${orderCounter++}`,
      type: 'emergency',
      title: `Внеплановая остановка конвейера К-3: ${fault.description}`,
      description: `Аварийная вибрация и перегрев приводного барабана конвейера К-3. Опасность повреждения ленты.`,
      workshopId: convK3.workshopId,
      equipmentId: convK3.id,
      equipmentName: convK3.name,
      assignedWorkerId: worker.id,
      assignedWorkerName: worker.fullName,
      issuedByMasterId: masters[0].id,
      issuedByMasterName: masters[0].fullName,
      priority: 'emergency',
      createdAt: orderTime.toISOString(),
      deadlineAt: new Date(orderTime.getTime() + 3 * 3600 * 1000).toISOString(),
      acceptedAt: new Date(orderTime.getTime() + 8 * 60 * 1000).toISOString(),
      startedAt: new Date(orderTime.getTime() + 15 * 60 * 1000).toISOString(),
      completedAt: completedTime.toISOString(),
      closedAt: new Date(completedTime.getTime() + 10 * 60 * 1000).toISOString(),
      status: 'closed',
      statusHistory: [
        {
          id: `ev_${i}_1`,
          orderId: `ord_convk3_${i}`,
          timestamp: orderTime.toISOString(),
          actorId: masters[0].id,
          actorName: masters[0].fullName,
          action: 'Выдан',
        },
        {
          id: `ev_${i}_2`,
          orderId: `ord_convk3_${i}`,
          timestamp: new Date(orderTime.getTime() + 8 * 60 * 1000).toISOString(),
          actorId: worker.id,
          actorName: worker.fullName,
          action: 'Принят в работу',
        },
        {
          id: `ev_${i}_3`,
          orderId: `ord_convk3_${i}`,
          timestamp: completedTime.toISOString(),
          actorId: worker.id,
          actorName: worker.fullName,
          action: 'Исполнено',
          comment: 'Подшипник заменен, произведена смазка Литол-24.',
        },
        {
          id: `ev_${i}_4`,
          orderId: `ord_convk3_${i}`,
          timestamp: new Date(completedTime.getTime() + 10 * 60 * 1000).toISOString(),
          actorId: masters[0].id,
          actorName: masters[0].fullName,
          action: 'Закрыт мастером',
          comment: 'Принято с отметкой ИИ о повышенной частоте поломок.',
        },
      ],
      faultCode: fault.code,
      materialsSpent: [
        { materialId: 'mat_1', materialName: 'Подшипник сферический роликовый 22320 CW33', quantity: 1, unit: 'шт' },
        { materialId: 'mat_5', materialName: 'Смазка пластичная Литол-24 / EP-2', quantity: 2, unit: 'кг' },
      ],
      performedWorkDescription: 'Демонтаж защитного кожуха, распрессовка вышедшего из строя подшипника 22320, посадка нового подшипника с преднатягом, набивка смазки.',
      workerComment: 'Вал имеет следы биения. Рекомендуется проверка соосности.',
      downtimeHours: durationHours,
      aiEvaluation: evaluation,
    });
  }

  const tokaevWorker = EMPLOYEES.find((e) => e.id === 'emp_4')!;
  for (let i = 1; i <= 18; i++) {
    const daysAgo = 80 - i * 4;
    const orderTime = new Date(now - daysAgo * dayMs);
    const eq = EQUIPMENT_LIST[i % EQUIPMENT_LIST.length];
    const isRepeat = i % 3 === 0; 
    const durationHours = 2.5 + (i % 2) * 0.8;
    const completedTime = new Date(orderTime.getTime() + durationHours * 3600 * 1000);

    orders.push({
      id: `ord_tokaev_${i}`,
      number: `№${orderCounter++}`,
      type: isRepeat ? 'emergency' : 'planned',
      title: `${isRepeat ? 'Повторный отказ узла' : 'Техническое обслуживание'}: ${eq.name}`,
      description: `Устранение люфта и регулировка креплений на агрегате ${eq.name}.`,
      workshopId: eq.workshopId,
      equipmentId: eq.id,
      equipmentName: eq.name,
      assignedWorkerId: tokaevWorker.id,
      assignedWorkerName: tokaevWorker.fullName,
      issuedByMasterId: masters[0].id,
      issuedByMasterName: masters[0].fullName,
      priority: isRepeat ? 'high' : 'normal',
      createdAt: orderTime.toISOString(),
      deadlineAt: new Date(orderTime.getTime() + 4 * 3600 * 1000).toISOString(),
      acceptedAt: new Date(orderTime.getTime() + 12 * 60 * 1000).toISOString(),
      startedAt: new Date(orderTime.getTime() + 25 * 60 * 1000).toISOString(),
      completedAt: completedTime.toISOString(),
      closedAt: new Date(completedTime.getTime() + 20 * 60 * 1000).toISOString(),
      status: 'closed',
      statusHistory: [],
      faultCode: isRepeat ? 'М-05' : 'С-01',
      materialsSpent: [
        { materialId: 'mat_11', materialName: 'Болт футеровочный броневой М24х160 с гайкой', quantity: 4, unit: 'шт' },
      ],
      performedWorkDescription: 'Протяжка болтов, проверка уровня масла.',
      workerComment: isRepeat ? 'Повторное ослабление крепежа' : 'Работы выполнены',
      downtimeHours: durationHours,
      aiEvaluation: {
        verdict: isRepeat ? 'approved_with_notes' : 'approved',
        score: isRepeat ? 72 : 88,
        explanation: isRepeat
          ? 'Внимание: данный исполнитель имеет 28% повторных обращений в течение 7 дней после ремонта узлов крепления.'
          : 'Выполнено штатно.',
        workDescriptionMatch: true,
        materialLogicCheck: true,
        timeNormMatch: true,
        workerFeedback: 'Обратите внимание на момент затяжки динамометрическим ключом.',
        masterNotes: 'Рекомендуется направить исполнителя на инструктаж по моментам затяжки.',
      },
    });
  }

  const ksdCrusher = EQUIPMENT_LIST.find((e) => e.id === 'eq_ksd_2200')!;
  for (let i = 1; i <= 15; i++) {
    const daysAgo = 75 - i * 4.5;
    const orderTime = new Date(now - daysAgo * dayMs);
    const worker = workers[i % workers.length];
    const durationHours = 1.8;
    const completedTime = new Date(orderTime.getTime() + durationHours * 3600 * 1000);

    orders.push({
      id: `ord_oil_ksd_${i}`,
      number: `№${orderCounter++}`,
      type: 'emergency',
      title: `Долив и опрессовка маслосистемы: ${ksdCrusher.name}`,
      description: `Сигнал датчика низкого уровня масла в картере дробилки КСД-2200. Требуется доливка и поиск течи.`,
      workshopId: ksdCrusher.workshopId,
      equipmentId: ksdCrusher.id,
      equipmentName: ksdCrusher.name,
      assignedWorkerId: worker.id,
      assignedWorkerName: worker.fullName,
      issuedByMasterId: masters[1].id,
      issuedByMasterName: masters[1].fullName,
      priority: 'high',
      createdAt: orderTime.toISOString(),
      deadlineAt: new Date(orderTime.getTime() + 3 * 3600 * 1000).toISOString(),
      acceptedAt: new Date(orderTime.getTime() + 6 * 60 * 1000).toISOString(),
      startedAt: new Date(orderTime.getTime() + 10 * 60 * 1000).toISOString(),
      completedAt: completedTime.toISOString(),
      closedAt: new Date(completedTime.getTime() + 15 * 60 * 1000).toISOString(),
      status: 'closed',
      statusHistory: [],
      faultCode: 'С-04',
      materialsSpent: [
        { materialId: 'mat_3', materialName: 'Масло индустриальное И-40А', quantity: 45, unit: 'л' }, 
      ],
      performedWorkDescription: 'Доливка 45 литров масла И-40А, осмотр маслопроводов. Визуально обнаружено масляное пятно под корпусом станины.',
      workerComment: 'Возможна трещина в картере станины.',
      downtimeHours: durationHours,
      aiEvaluation: {
        verdict: 'approved_with_notes',
        score: 80,
        explanation: 'Аномалия расхода: списание масла И-40А превышает норму расхода в 2.4 раза (45 л при норме 18 л). Вероятна нелокализованная утечка картера.',
        workDescriptionMatch: true,
        materialLogicCheck: false,
        timeNormMatch: true,
        workerFeedback: 'Укажите точную локацию пятна утечки.',
        masterNotes: 'Запланировать дефектоскопию картера КСД-2200 при ближайшем останове.',
      },
    });
  }

  const generalFaults = FAULT_CODES;
  const generalEquipment = EQUIPMENT_LIST;

  for (let i = 0; i < 480; i++) {
    const daysAgo = Math.random() * 88;
    const orderTime = new Date(now - daysAgo * dayMs);
    const eq = generalEquipment[i % generalEquipment.length];
    const fault = generalFaults[i % generalFaults.length];
    const worker = workers[i % workers.length];
    const master = masters[i % masters.length];
    const isEmergency = Math.random() < 0.35;
    const durationHours = 0.8 + Math.random() * 3.2;
    const completedTime = new Date(orderTime.getTime() + durationHours * 3600 * 1000);
    const isOverdue = Math.random() < 0.08;

    const mat1 = MATERIALS_CATALOG[(i * 3) % MATERIALS_CATALOG.length];
    const mat2 = MATERIALS_CATALOG[(i * 7) % MATERIALS_CATALOG.length];

    orders.push({
      id: `ord_gen_${i}`,
      number: `№${orderCounter++}`,
      type: isEmergency ? 'emergency' : 'planned',
      title: `${isEmergency ? 'Аварийный ремонт' : 'Плановое ТО'}: ${eq.name}`,
      description: `${fault.description} на объекте ${eq.name}.`,
      workshopId: eq.workshopId,
      equipmentId: eq.id,
      equipmentName: eq.name,
      assignedWorkerId: worker.id,
      assignedWorkerName: worker.fullName,
      issuedByMasterId: master.id,
      issuedByMasterName: master.fullName,
      priority: isEmergency ? (Math.random() < 0.4 ? 'emergency' : 'high') : 'normal',
      createdAt: orderTime.toISOString(),
      deadlineAt: new Date(orderTime.getTime() + (isEmergency ? 2.5 : 5) * 3600 * 1000).toISOString(),
      acceptedAt: new Date(orderTime.getTime() + (5 + Math.random() * 15) * 60 * 1000).toISOString(),
      startedAt: new Date(orderTime.getTime() + (20 + Math.random() * 25) * 60 * 1000).toISOString(),
      completedAt: completedTime.toISOString(),
      closedAt: new Date(completedTime.getTime() + 15 * 60 * 1000).toISOString(),
      status: 'closed',
      statusHistory: [],
      faultCode: fault.code,
      materialsSpent: [
        { materialId: mat1.id, materialName: mat1.name, quantity: 1 + (i % 3), unit: mat1.unit },
        ...(i % 2 === 0 ? [{ materialId: mat2.id, materialName: mat2.name, quantity: 1 + (i % 2), unit: mat2.unit }] : []),
      ],
      performedWorkDescription: `Выполнены регламентные работы по устранению дефекта: ${fault.description}. Проведена замена расходных элементов, наладка зазоров и тестирование под нагрузкой.`,
      workerComment: 'Агрегат проверен, передан оператору в эксплуатацию.',
      isOverdue: isOverdue,
      overdueMinutes: isOverdue ? Math.floor(15 + Math.random() * 45) : 0,
      downtimeHours: parseFloat(durationHours.toFixed(1)),
      aiEvaluation: {
        verdict: 'approved',
        score: Math.floor(88 + Math.random() * 12),
        explanation: 'Работы выполнены в полном соответствии с регламентом ТК и нормами времени.',
        workDescriptionMatch: true,
        materialLogicCheck: true,
        timeNormMatch: !isOverdue,
        workerFeedback: 'Отличное качество исполнения.',
        masterNotes: 'Претензий нет.',
      },
    });
  }

  return orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
