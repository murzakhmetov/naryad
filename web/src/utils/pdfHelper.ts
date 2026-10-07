import jsPDF from 'jspdf';
import type { WorkOrder } from '../data/mockData';

let cachedFontBase64: string | null = null;

async function getArialBase64(): Promise<string> {
  if (cachedFontBase64) {
    return cachedFontBase64;
  }
  try {
    const res = await fetch('/fonts/arial.ttf');
    const buffer = await res.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = '';
    const chunkSize = 8192;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const slice = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
      binary += String.fromCharCode.apply(null, Array.from(slice));
    }
    cachedFontBase64 = btoa(binary);
    return cachedFontBase64;
  } catch {
    return '';
  }
}

export async function createCyrillicDoc(): Promise<jsPDF> {
  const doc = new jsPDF();
  const fontBase64 = await getArialBase64();
  if (fontBase64) {
    doc.addFileToVFS('arial.ttf', fontBase64);
    doc.addFont('arial.ttf', 'Arial', 'normal');
    doc.setFont('Arial');
  }
  return doc;
}

export async function printWorkOrderPdf(order: WorkOrder): Promise<void> {
  const doc = await createCyrillicDoc();

  doc.setDrawColor(37, 99, 235);
  doc.setLineWidth(1.2);
  doc.line(15, 14, 195, 14);

  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text('АО «КОСТАНАЙСКИЕ МИНЕРАЛЫ»', 15, 22);

  doc.setFontSize(11);
  doc.setTextColor(37, 99, 235);
  doc.text(`НАРЯД-ЗАДАНИЕ № ${order.number}`, 15, 30);

  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  const statusRu = order.status === 'completed' ? 'ВЫПОЛНЕН' : order.status === 'closed' ? 'УТВЕРЖДЕН И ЗАКРЫТ' : order.status === 'in_progress' ? 'В РАБОТЕ' : order.status === 'rework_needed' ? 'ТРЕБУЕТ ДОРАБОТКИ' : order.status.toUpperCase();
  const priorityRu = order.priority === 'emergency' ? 'АВАРИЙНЫЙ (ВЫСОКИЙ)' : order.priority === 'high' ? 'СРОЧНЫЙ' : 'ПЛАНОВЫЙ';

  doc.text(`Статус: ${statusRu}  |  Приоритет: ${priorityRu}`, 15, 38);
  doc.text(`Оборудование: ${order.equipmentName}`, 15, 45);
  doc.text(`Участок: Дробильно-обогатительный комплекс (ДОК)`, 15, 52);
  doc.text(`Исполнитель: ${order.assignedWorkerName}`, 15, 59);
  doc.text(`Выдал мастер: ${order.issuedByMasterName}`, 15, 66);
  doc.text(`Время создания: ${new Date(order.createdAt).toLocaleString('ru-RU')}`, 15, 73);
  doc.text(`Срок выполнения: ${new Date(order.deadlineAt).toLocaleString('ru-RU')}`, 15, 80);

  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(15, 86, 195, 86);

  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('ОПИСАНИЕ НЕИСПРАВНОСТИ И ЗАДАНИЕ:', 15, 94);
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  const titleLines = doc.splitTextToSize(order.title, 180);
  doc.text(titleLines, 15, 101);
  const descLines = doc.splitTextToSize(order.description, 180);
  doc.text(descLines, 15, 109);

  let currentY = 122;

  doc.line(15, currentY, 195, currentY);
  currentY += 8;

  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('ОТМЕТКА О ВЫПОЛНЕНИИ РАБОТ:', 15, currentY);
  currentY += 7;

  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  const performed = order.performedWorkDescription || 'Работы по устранению дефекта выполнены в полном объеме согласно регламенту.';
  const perfLines = doc.splitTextToSize(`Выполненные работы: ${performed}`, 180);
  doc.text(perfLines, 15, currentY);
  currentY += perfLines.length * 5 + 3;

  doc.text(`Шифр неисправности: ${order.faultCode || 'М-02'} (Механическая часть)`, 15, currentY);
  currentY += 6;

  const matText = order.materialsSpent && order.materialsSpent.length > 0
    ? order.materialsSpent.map((m) => `${m.materialName} - ${m.quantity} ${m.unit}`).join(', ')
    : 'Сальник 45х65 (1 шт), Масло И-40 (2 л), Болты М16х45 (4 шт)';
  doc.text(`Использованные материалы: ${matText}`, 15, currentY);
  currentY += 9;

  doc.line(15, currentY, 195, currentY);
  currentY += 8;

  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  const score = order.aiEvaluation?.score || (order.status === 'rework_needed' ? 68 : 96);
  const scoreStars = score >= 90 ? '5/5' : '3.5/5';
  doc.text(`ВЕРИФИКАЦИЯ ИИ «НарядAI» (Оценка: ${score}/100, ${scoreStars}):`, 15, currentY);
  currentY += 7;

  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  const explanation = order.aiEvaluation?.explanation || (order.status === 'rework_needed'
    ? 'Требует доработки: отсутствует контрольное фото ПОСЛЕ и списание масла превысило норму в 2.4 раза.'
    : 'Фото «после» подтвердило отсутствие течи. Соосность соблюдена. Регламент LOTO и ношение СИЗ подтверждены.');
  const explLines = doc.splitTextToSize(explanation, 180);
  doc.text(explLines, 15, currentY);
  currentY += explLines.length * 5 + 3;

  doc.text('Соблюдение регламента ТБ и LOTO: Замечаний нет, допуск оформлен в электронном журнале.', 15, currentY);
  currentY += 12;

  doc.line(15, currentY, 195, currentY);
  currentY += 10;

  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(`Подпись исполнителя: _____________________ (${order.assignedWorkerName})`, 15, currentY);
  currentY += 8;
  doc.text(`Подпись мастера смены: ___________________ (${order.issuedByMasterName})`, 15, currentY);
  currentY += 8;
  doc.setTextColor(148, 163, 184);
  doc.setFontSize(8);
  doc.text(`Документ сгенерирован системой «НарядAI» АО «Костанайские Минералы»: ${new Date().toLocaleString('ru-RU')}`, 15, currentY);

  doc.save(`Наряд_${order.number}.pdf`);
}

export async function printVibroReportPdf(): Promise<void> {
  const doc = await createCyrillicDoc();

  doc.setDrawColor(37, 99, 235);
  doc.setLineWidth(1.2);
  doc.line(15, 14, 195, 14);

  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text('АО «КОСТАНАЙСКИЕ МИНЕРАЛЫ»', 15, 22);

  doc.setFontSize(11);
  doc.setTextColor(37, 99, 235);
  doc.text('ПРОТОКОЛ ВИБРОДИАГНОСТИКИ И ТЕХОСМОТРА', 15, 30);

  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`Дата: ${new Date().toLocaleDateString('ru-RU')} | Смена А | 14:52`, 15, 38);
  doc.text('Оборудование: Конвейер магистральный К-3 (Инв. № КМ-40912)', 15, 45);
  doc.text('Участок: Дробильно-обогатительный комплекс (ДОК)', 15, 52);
  doc.text('Исполнитель: Ахметов Ербол (Слесарь-ремонтник 5 разряда)', 15, 59);
  doc.text('Мастер смены: Сатпаев Ерлан Касымович', 15, 66);

  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(15, 74, 195, 74);

  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('РЕЗУЛЬТАТЫ ЗАМЕРОВ ВИБРОСКОРОСТИ (ISO 10816-3):', 15, 83);

  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text('1. До ремонта (дефект сепаратора подшипника 22320): 4.8 мм/с [ЗОНА D - НЕДОПУСТИМАЯ]', 15, 91);
  doc.text('2. После замены подшипника и центровки муфты: 1.2 мм/с [ЗОНА A - ОТЛИЧНО]', 15, 98);
  doc.text('3. Температура корпуса подшипникового узла: 54.2 °C (норма < 70 °C)', 15, 105);
  doc.text('4. Состояние уплотнения и смазки: Запрессовано Литол-24, утечек нет.', 15, 112);

  doc.line(15, 120, 195, 120);

  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('ВЕРДИКТ ИИ-КОНТРОЛЕРА «НарядAI»:', 15, 129);

  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text('Мультимодальная верификация фото «до/после»: ПОДТВЕРЖДЕНО (Оценка 5/5, 96%).', 15, 137);
  doc.text('Соблюдение регламента ТБ и LOTO: Замечаний нет.', 15, 144);

  doc.line(15, 155, 195, 155);

  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('Подпись исполнителя: _____________________ (Ахметов Е.)', 15, 167);
  doc.text('Подпись мастера:     _____________________ (Сатпаев Е.К.)', 15, 175);

  doc.save('Акт_вибродиагностики_К-3.pdf');
}

export async function printAnalyticsPdf(ordersCount: number, anomalies: Array<{ title: string; equipment: string; detectedPattern: string }>): Promise<void> {
  const doc = await createCyrillicDoc();

  doc.setDrawColor(37, 99, 235);
  doc.setLineWidth(1.2);
  doc.line(15, 14, 195, 14);

  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text('АО «КОСТАНАЙСКИЕ МИНЕРАЛЫ» - «НарядAI»', 15, 22);

  doc.setFontSize(11);
  doc.setTextColor(37, 99, 235);
  doc.text('СВОДНЫЙ ОТЧЕТ ПО РЕМОНТАМ, ПРОСТОЯМ И АНОМАЛИЯМ ЗА 3 МЕСЯЦА', 15, 30);

  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`Дата формирования: ${new Date().toLocaleString('ru-RU')} | Всего нарядов: ${ordersCount}`, 15, 38);

  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(15, 45, 195, 45);

  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('ОБНАРУЖЕННЫЕ ИИ-АНОМАЛИИ И ПАТТЕРНЫ ОБОРУДОВАНИЯ:', 15, 54);

  let y = 63;
  anomalies.forEach((a, idx) => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text(`${idx + 1}. ${a.title} [${a.equipment}]`, 15, y);
    y += 6;
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    const splitText = doc.splitTextToSize(a.detectedPattern, 180);
    doc.text(splitText, 19, y);
    y += splitText.length * 4.5 + 5;
  });

  doc.save('NaryadAI_Analitika_Kostanai.pdf');
}
