import '../models/models.dart';

final List<FaultCodeModel> kFaultCodes = [
  FaultCodeModel(code: 'М-01', category: 'Механика', description: 'Заклинивание дробящего конуса', normHours: 2.5),
  FaultCodeModel(code: 'М-02', category: 'Механика', description: 'Разрушение подшипникового узла привода', normHours: 3.0),
  FaultCodeModel(code: 'М-03', category: 'Механика', description: 'Порыв / сход конвейерной ленты', normHours: 1.5),
  FaultCodeModel(code: 'М-04', category: 'Механика', description: 'Износ броней и футеровки', normHours: 4.0),
  FaultCodeModel(code: 'М-05', category: 'Механика', description: 'Ослабление крепежных болтов', normHours: 1.0),
  FaultCodeModel(code: 'Э-01', category: 'Электрика', description: 'Срабатывание тепловой защиты', normHours: 1.0),
  FaultCodeModel(code: 'Э-02', category: 'Электрика', description: 'Обрыв / пробой кабеля питания', normHours: 2.0),
  FaultCodeModel(code: 'Э-05', category: 'Электрика', description: 'Короткое замыкание в цепи управления', normHours: 1.5),
  FaultCodeModel(code: 'Г-01', category: 'Гидравлика', description: 'Падение давления в гидросистеме', normHours: 1.5),
  FaultCodeModel(code: 'Г-02', category: 'Гидравлика', description: 'Разрыв рукава высокого давления (РВД)', normHours: 1.0),
  FaultCodeModel(code: 'Г-03', category: 'Гидравлика', description: 'Течь масла через уплотнения', normHours: 2.0),
  FaultCodeModel(code: 'С-01', category: 'Смазка', description: 'Низкий уровень масла в картере', normHours: 0.5),
  FaultCodeModel(code: 'С-04', category: 'Смазка', description: 'Аномальный перерасход смазки', normHours: 1.5),
];

final List<MaterialModel> kMaterials = [
  MaterialModel(id: 'mat_1', name: 'Подшипник сферический 22320 CW33', unit: 'шт'),
  MaterialModel(id: 'mat_2', name: 'Масло индустриальное И-40А', unit: 'л'),
  MaterialModel(id: 'mat_3', name: 'Смазка Литол-24', unit: 'кг'),
  MaterialModel(id: 'mat_4', name: 'Рукав высокого давления РВД DN25', unit: 'шт'),
  MaterialModel(id: 'mat_5', name: 'Болт броневой М24х160', unit: 'шт'),
  MaterialModel(id: 'mat_6', name: 'Сальниковая набивка Графлекс Н-4000', unit: 'кг'),
  MaterialModel(id: 'mat_7', name: 'Ремень клиновой В-2500', unit: 'шт'),
];

List<WorkOrderModel> getInitialOrders() {
  return [
    WorkOrderModel(
      id: 'ord_1',
      number: '№147',
      title: 'Аварийный перегрев подшипника привода КМД-1750',
      description: 'Дробилка КМД-1750, участок дробления. Температура подшипника +85°C. Опасность заклинивания конуса.',
      equipmentName: 'Дробилка конусная КМД-1750Т',
      workshopName: 'Участок крупного дробления',
      priority: 'emergency',
      createdAt: '14:20',
      deadlineAt: '16:00',
      status: 'in_progress',
      photoBeforeUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
      isOverdue: true,
      faultCode: 'М-02',
    ),
    WorkOrderModel(
      id: 'ord_2',
      number: '№148',
      title: 'Течь масла сальника шламового насоса 1ГрТ',
      description: 'Участок обогащения, насос 1ГрТ. Течь масла через сальниковое уплотнение.',
      equipmentName: 'Насос шламовый 1ГрТ 400/40',
      workshopName: 'Участок обогащения',
      priority: 'emergency',
      createdAt: '14:35',
      deadlineAt: '17:00',
      status: 'issued',
      photoBeforeUrl: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=600&q=80',
    ),
    WorkOrderModel(
      id: 'ord_3',
      number: '№149',
      title: 'Плановая ревизия роликов конвейера К-3',
      description: 'Осмотр соосности и подшипников натяжного барабана.',
      equipmentName: 'Конвейер ленточный К-3',
      workshopName: 'Участок крупного дробления',
      priority: 'normal',
      createdAt: '11:00',
      deadlineAt: '18:00',
      status: 'queued',
    ),
  ];
}
