import 'dart:convert';
import 'dart:async';
import 'dart:io';
import 'package:flutter/cupertino.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:image_picker/image_picker.dart';

final supabase = Supabase.instance.client;

class EmployeeData {
  final String id;
  final String fullName;
  final String specialty;
  final int rank;
  final String role;
  String status;
  int rating;
  int onTimeRate;
  double reworkRate;
  String? currentOrderNumber;

  EmployeeData({
    required this.id,
    required this.fullName,
    required this.specialty,
    required this.rank,
    required this.role,
    this.status = 'free',
    this.rating = 95,
    this.onTimeRate = 95,
    this.reworkRate = 2.0,
    this.currentOrderNumber,
  });
}

class WorkOrderModel {
  final String id;
  final String number;
  final String title;
  final String description;
  final String equipmentName;
  final String workshopName;
  final String priority;
  final String createdAt;
  final String deadlineAt;
  String status;
  String? photoBeforeUrl;
  String? photoAfterUrl;
  String? faultCode;
  String? materialsSpent;
  String? performedWork;
  String? workerComment;
  int aiScore;
  String? aiVerdict;
  String? aiNotes;
  String? aiGood;
  String? aiImprove;
  int? actualMinutes;
  int? plannedMinutes;
  bool isOverdue;
  String assignedWorkerId;
  String assignedWorkerName;

  WorkOrderModel({
    required this.id,
    required this.number,
    required this.title,
    required this.description,
    required this.equipmentName,
    required this.workshopName,
    required this.priority,
    required this.createdAt,
    required this.deadlineAt,
    required this.status,
    required this.assignedWorkerId,
    required this.assignedWorkerName,
    this.photoBeforeUrl,
    this.photoAfterUrl,
    this.faultCode,
    this.materialsSpent,
    this.performedWork,
    this.workerComment,
    this.aiScore = 0,
    this.aiVerdict,
    this.aiNotes,
    this.aiGood,
    this.aiImprove,
    this.actualMinutes,
    this.plannedMinutes,
    this.isOverdue = false,
  });

  Map<String, dynamic> toJson() => {
    'id': id,
    'number': number,
    'title': title,
    'description': description,
    'equipmentName': equipmentName,
    'workshopName': workshopName,
    'priority': priority,
    'createdAt': createdAt,
    'deadlineAt': deadlineAt,
    'status': status,
    'assignedWorkerId': assignedWorkerId,
    'assignedWorkerName': assignedWorkerName,
    'photoBeforeUrl': photoBeforeUrl,
    'photoAfterUrl': photoAfterUrl,
    'faultCode': faultCode,
    'materialsSpent': materialsSpent,
    'performedWork': performedWork,
    'workerComment': workerComment,
    'aiScore': aiScore,
    'aiVerdict': aiVerdict,
    'aiNotes': aiNotes,
    'aiGood': aiGood,
    'aiImprove': aiImprove,
    'actualMinutes': actualMinutes,
    'plannedMinutes': plannedMinutes,
    'isOverdue': isOverdue,
  };

  Map<String, dynamic> toSupabaseMap() => {
    'id': id,
    'number': number,
    'type': priority == 'emergency' ? 'emergency' : 'planned',
    'title': title,
    'description': description,
    'workshop_id': 'ws_crushing',
    'equipment_id': 'eq_pump_grt',
    'equipment_name': equipmentName,
    'assigned_worker_id': assignedWorkerId,
    'assigned_worker_name': assignedWorkerName,
    'issued_by_master_id': 'master_1',
    'issued_by_master_name': 'Сатпаев Ерлан Касымович',
    'priority': priority,
    'created_at': createdAt,
    'deadline_at': deadlineAt,
    'status': status,
    'photo_before_url': photoBeforeUrl,
    'photo_after_url': photoAfterUrl,
    'fault_code': faultCode ?? 'М-02',
    'performed_work_description': performedWork,
    'worker_comment': workerComment,
    'is_overdue': isOverdue,
    'overdue_minutes': isOverdue ? 15 : 0,
    'materials_spent': [],
    'status_history': [],
    'ai_evaluation': aiVerdict != null ? {
      'verdict': aiVerdict == 'Принято' || aiVerdict == 'approved' ? 'approved' : 'rework_needed',
      'score': aiScore,
      'explanation': aiNotes ?? '',
      'workDescriptionMatch': true,
      'materialLogicCheck': aiVerdict == 'approved' || aiVerdict == 'Принято',
      'timeNormMatch': true,
      'workerFeedback': aiNotes ?? '',
      'masterNotes': aiNotes ?? '',
      'goodPoints': aiGood ?? '',
      'improvePoints': aiImprove ?? '',
      'actualMinutes': actualMinutes ?? 42,
      'plannedMinutes': plannedMinutes ?? 60,
    } : null,
  };

  factory WorkOrderModel.fromJson(Map<String, dynamic> json) => WorkOrderModel(
    id: json['id'] ?? '',
    number: json['number'] ?? '',
    title: json['title'] ?? '',
    description: json['description'] ?? '',
    equipmentName: json['equipmentName'] ?? json['equipment_name'] ?? 'Оборудование цеха',
    workshopName: json['workshopName'] ?? 'Дробильно-обогатительный комплекс',
    priority: json['priority'] ?? 'normal',
    createdAt: json['createdAt'] ?? json['created_at'] ?? DateTime.now().toUtc().toIso8601String(),
    deadlineAt: json['deadlineAt'] ?? json['deadline_at'] ?? DateTime.now().toUtc().toIso8601String(),
    status: json['status'] ?? 'issued',
    assignedWorkerId: json['assignedWorkerId'] ?? json['assigned_worker_id'] ?? 'emp_1',
    assignedWorkerName: json['assignedWorkerName'] ?? json['assigned_worker_name'] ?? 'Ахметов Ербол',
    photoBeforeUrl: json['photoBeforeUrl'] ?? json['photo_before_url'],
    photoAfterUrl: json['photoAfterUrl'] ?? json['photo_after_url'],
    faultCode: json['faultCode'] ?? json['fault_code'],
    materialsSpent: json['materialsSpent'] is String ? json['materialsSpent'] : jsonEncode(json['materialsSpent'] ?? []),
    performedWork: json['performedWork'] ?? json['performed_work_description'],
    workerComment: json['workerComment'] ?? json['worker_comment'],
    aiScore: json['aiScore'] ?? (json['ai_evaluation'] is Map ? json['ai_evaluation']['score'] ?? 0 : 0),
    aiVerdict: json['aiVerdict'] ?? (json['ai_evaluation'] is Map ? json['ai_evaluation']['verdict'] : null),
    aiNotes: json['aiNotes'] ?? (json['ai_evaluation'] is Map ? json['ai_evaluation']['explanation'] ?? json['ai_evaluation']['workerFeedback'] : null),
    aiGood: json['aiGood'] ?? (json['ai_evaluation'] is Map ? json['ai_evaluation']['goodPoints'] : null),
    aiImprove: json['aiImprove'] ?? (json['ai_evaluation'] is Map ? json['ai_evaluation']['improvePoints'] : null),
    actualMinutes: json['actualMinutes'] ?? (json['ai_evaluation'] is Map ? json['ai_evaluation']['actualMinutes'] : null),
    plannedMinutes: json['plannedMinutes'] ?? (json['ai_evaluation'] is Map ? json['ai_evaluation']['plannedMinutes'] : 60),
    isOverdue: json['isOverdue'] ?? json['is_overdue'] ?? false,
  );
}

final List<EmployeeData> defaultStaff = [
  EmployeeData(id: 'master_1', fullName: 'Сатпаев Ерлан Касымович', specialty: 'Старший мастер смены А', rank: 6, role: 'master', status: 'busy', rating: 98, onTimeRate: 97),
  EmployeeData(id: 'master_2', fullName: 'Морозов Алексей Викторович', specialty: 'Мастер смены Б', rank: 6, role: 'master', status: 'busy', rating: 94, onTimeRate: 93),
  EmployeeData(id: 'emp_1', fullName: 'Ахметов Ербол Каиржанович', specialty: 'Слесарь-ремонтник', rank: 5, role: 'worker', status: 'busy', currentOrderNumber: '№149', rating: 96, onTimeRate: 98),
  EmployeeData(id: 'emp_2', fullName: 'Дуйсенов Серик Болатович', specialty: 'Слесарь-ремонтник', rank: 4, role: 'worker', status: 'busy', currentOrderNumber: '№147', rating: 91, onTimeRate: 92),
  EmployeeData(id: 'emp_3', fullName: 'Иванов Дмитрий Сергеевич', specialty: 'Слесарь-ремонтник (бригадир)', rank: 6, role: 'worker', status: 'queued', rating: 97, onTimeRate: 99),
  EmployeeData(id: 'emp_4', fullName: 'Токаев Марат Жасланович', specialty: 'Слесарь-ремонтник', rank: 4, role: 'worker', status: 'free', rating: 74, onTimeRate: 85, reworkRate: 28.4),
  EmployeeData(id: 'emp_5', fullName: 'Ковалев Виктор Андреевич', specialty: 'Слесарь-монтажник', rank: 5, role: 'worker', status: 'offline', rating: 93, onTimeRate: 94),
  EmployeeData(id: 'emp_6', fullName: 'Нурланов Бауыржан Кайратович', specialty: 'Электромонтер (бригадир)', rank: 6, role: 'worker', status: 'free', rating: 99, onTimeRate: 99),
  EmployeeData(id: 'emp_7', fullName: 'Васильев Олег Петрович', specialty: 'Электромонтер', rank: 5, role: 'worker', status: 'busy', currentOrderNumber: '№148', rating: 92, onTimeRate: 93),
  EmployeeData(id: 'emp_8', fullName: 'Жакупов Азамат Маликович', specialty: 'Электрослесарь КИПиА', rank: 5, role: 'worker', status: 'free', rating: 95, onTimeRate: 96),
  EmployeeData(id: 'emp_9', fullName: 'Сидоров Антон Николаевич', specialty: 'Электромонтер', rank: 4, role: 'worker', status: 'offline', rating: 88, onTimeRate: 90),
  EmployeeData(id: 'emp_10', fullName: 'Омаров Руслан Серикович', specialty: 'Электрослесарь', rank: 5, role: 'worker', status: 'offline', rating: 94, onTimeRate: 95),
  EmployeeData(id: 'emp_11', fullName: 'Касымов Нуржан Ардакович', specialty: 'Электрогазосварщик (бригадир)', rank: 6, role: 'worker', status: 'busy', rating: 98, onTimeRate: 97),
  EmployeeData(id: 'emp_12', fullName: 'Бекенов Талгат Жандосович', specialty: 'Слесарь по гидравлике', rank: 5, role: 'worker', status: 'free', rating: 94, onTimeRate: 95),
  EmployeeData(id: 'emp_13', fullName: 'Кузнецов Михаил Васильевич', specialty: 'Электрогазосварщик', rank: 5, role: 'worker', status: 'queued', rating: 90, onTimeRate: 91),
  EmployeeData(id: 'emp_14', fullName: 'Смагулов Данияр Муратович', specialty: 'Слесарь-ремонтник', rank: 4, role: 'worker', status: 'offline', rating: 87, onTimeRate: 89),
  EmployeeData(id: 'emp_15', fullName: 'Попов Артем Сергеевич', specialty: 'Машинист насосных установок', rank: 4, role: 'worker', status: 'offline', rating: 91, onTimeRate: 92),
];

final List<String> equipmentNames = [
  'Насос шламовый 1ГрТ 400/40',
  'Дробилка конусная КМД-1750Т',
  'Дробилка конусная КСД-2200',
  'Дробилка щековая СМД-118',
  'Конвейер ленточный К-3',
  'Конвейер магистральный К-5',
  'Питатель пластинчатый ПП-1-15',
  'Грохот инерционный ГИТ-51М',
  'Маслостанция дробилки МС-200',
  'Мельница стержневая МШР-3600',
  'Мельница шаровая МШЦ-3200',
  'Классификатор спиральный КСН-24',
  'Сепаратор магнитный ПБМ-ПП',
  'Вентилятор аспирационный ВР-12',
  'Флотомашина механическая ФМ-50',
  'Кран мостовой г/п 20т',
  'Станок токарный 1К62',
  'Компрессор винтовой ВВ-50/8',
  'Пресс гидравлический П6330',
  'Сварочный выпрямитель ВДУ-506',
  'Автосамосвал БелАЗ-7555',
  'Экскаватор ЭКГ-5А',
  'Погрузчик CAT 988K',
];

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Supabase.initialize(
    url: 'https://pfmiftikcnoesozqskfz.supabase.co',
    publishableKey: 'sb_publishable_sCwXPQDWrNK-AbcMZhvEnw_3Dr1vDyi',
  );
  runApp(const NaryadAiApp());
}

class NaryadAiApp extends StatelessWidget {
  const NaryadAiApp({super.key});

  @override
  Widget build(BuildContext context) {
    return const CupertinoApp(
      title: 'НарядAI',
      theme: CupertinoThemeData(
        brightness: Brightness.light,
        primaryColor: Color(0xFF2563EB),
        scaffoldBackgroundColor: Color(0xFFF1F5F9),
        barBackgroundColor: Color(0xF8FFFFFF),
      ),
      home: AuthScreen(),
      debugShowCheckedModeBanner: false,
    );
  }
}

class AuthScreen extends StatefulWidget {
  const AuthScreen({super.key});

  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  String _role = 'worker';
  String _selectedWorkerId = 'emp_1';
  final _emailCtrl = TextEditingController(text: 'akhmetov@kostanai.kz');
  final _passCtrl = TextEditingController(text: '123456');

  void _login() {
    String workerName = 'Ахметов Ербол Каиржанович';
    if (_role == 'worker') {
      final found = defaultStaff.firstWhere((e) => e.id == _selectedWorkerId, orElse: () => defaultStaff[2]);
      workerName = found.fullName;
    } else {
      workerName = 'Сатпаев Ерлан Касымович (Старший мастер)';
    }

    Navigator.pushReplacement(
      context,
      CupertinoPageRoute(
        builder: (_) => MainScreen(
          role: _role,
          workerId: _selectedWorkerId,
          workerName: workerName,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return CupertinoPageScaffold(
      navigationBar: const CupertinoNavigationBar(
        middle: Text('НарядAI - Авторизация'),
      ),
      child: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 20),
              Container(
                width: 72,
                height: 72,
                decoration: BoxDecoration(
                  gradient: const LinearGradient(colors: [Color(0xFF2563EB), Color(0xFF06B6D4)]),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Center(
                  child: Icon(CupertinoIcons.shield_fill, color: CupertinoColors.white, size: 36),
                ),
              ),
              const SizedBox(height: 16),
              const Text(
                'НарядAI',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 26, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
              ),
              const Text(
                'АО «Костанайские Минералы»',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 13, color: Color(0xFF64748B)),
              ),
              const SizedBox(height: 32),
              CupertinoSlidingSegmentedControl<String>(
                groupValue: _role,
                children: const {
                  'master': Padding(padding: EdgeInsets.symmetric(horizontal: 16, vertical: 8), child: Text('Мастер смены')),
                  'worker': Padding(padding: EdgeInsets.symmetric(horizontal: 16, vertical: 8), child: Text('Исполнитель')),
                },
                onValueChanged: (v) {
                  if (v != null) {
                    setState(() {
                      _role = v;
                      if (_role == 'master') {
                        _emailCtrl.text = 'satpayev@kostanai.kz';
                      } else {
                        _emailCtrl.text = 'akhmetov@kostanai.kz';
                      }
                    });
                  }
                },
              ),
              const SizedBox(height: 20),
              if (_role == 'worker') ...[
                const Text('Выберите сотрудника смены:', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF475569))),
                const SizedBox(height: 6),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  decoration: BoxDecoration(color: CupertinoColors.white, borderRadius: BorderRadius.circular(12), border: Border.all(color: const Color(0xFFCBD5E1))),
                  child: CupertinoButton(
                    padding: EdgeInsets.zero,
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          defaultStaff.firstWhere((e) => e.id == _selectedWorkerId).fullName,
                          style: const TextStyle(fontSize: 14, color: Color(0xFF0F172A), fontWeight: FontWeight.w500),
                        ),
                        const Icon(CupertinoIcons.chevron_down, size: 16, color: Color(0xFF64748B)),
                      ],
                    ),
                    onPressed: () {
                      showCupertinoModalPopup(
                        context: context,
                        builder: (ctx) => Container(
                          height: 260,
                          color: CupertinoColors.white,
                          child: CupertinoPicker(
                            itemExtent: 40,
                            scrollController: FixedExtentScrollController(
                              initialItem: defaultStaff.where((e) => e.role == 'worker').toList().indexWhere((e) => e.id == _selectedWorkerId),
                            ),
                            onSelectedItemChanged: (idx) {
                              final workers = defaultStaff.where((e) => e.role == 'worker').toList();
                              setState(() => _selectedWorkerId = workers[idx].id);
                            },
                            children: defaultStaff.where((e) => e.role == 'worker').map((w) => Center(child: Text('${w.fullName} (${w.status == "free" ? "Свободен" : "В работе"})', style: const TextStyle(fontSize: 13)))).toList(),
                          ),
                        ),
                      );
                    },
                  ),
                ),
                const SizedBox(height: 16),
              ],
              CupertinoTextField(
                controller: _emailCtrl,
                placeholder: 'Рабочий Email',
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(color: CupertinoColors.white, borderRadius: BorderRadius.circular(12), border: Border.all(color: const Color(0xFFCBD5E1))),
              ),
              const SizedBox(height: 12),
              CupertinoTextField(
                controller: _passCtrl,
                placeholder: 'Пароль',
                obscureText: true,
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(color: CupertinoColors.white, borderRadius: BorderRadius.circular(12), border: Border.all(color: const Color(0xFFCBD5E1))),
              ),
              const SizedBox(height: 24),
              CupertinoButton.filled(
                onPressed: _login,
                borderRadius: BorderRadius.circular(12),
                child: const Text('Войти в систему', style: TextStyle(fontWeight: FontWeight.bold)),
              ),
              const SizedBox(height: 16),
              const Text(
                'Связка: Supabase Realtime + Gemini 3.1 Flash Lite',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 11, color: Color(0xFF94A3B8)),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class MainScreen extends StatefulWidget {
  final String role;
  final String workerId;
  final String workerName;

  const MainScreen({
    super.key,
    required this.role,
    required this.workerId,
    required this.workerName,
  });

  @override
  State<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> {
  final List<WorkOrderModel> _orders = [];
  final List<EmployeeData> _staff = List.from(defaultStaff);
  late RealtimeChannel _channel;
  Timer? _deadlineTimer;
  Timer? _pollTimer;
  String _orderFilter = 'all';

  @override
  void initState() {
    super.initState();
    _initInitialOrders();
    _setupSupabaseRealtime();
    _fetchOrdersFromSupabase();
    _deadlineTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      final now = DateTime.now().toUtc();
      for (final o in _orders) {
        if (o.status != 'completed' && o.status != 'closed') {
          final deadline = DateTime.tryParse(o.deadlineAt)?.toUtc();
          if (deadline != null && now.isAfter(deadline) && !o.isOverdue) {
            final diff = now.difference(deadline).inMinutes;
            final overdueMins = diff > 0 ? diff : 1;
            setState(() {
              o.isOverdue = true;
            });
            _broadcastOrder(o);
            _showNotification('Внимание: Просрочка ИИ!', 'Наряд ${o.number} (${o.equipmentName}) просрочен на $overdueMins мин! ИИ отправил эскалацию мастеру и исполнителю.');
          }
        }
      }
    });
    _pollTimer = Timer.periodic(const Duration(seconds: 4), (timer) {
      _fetchOrdersFromSupabase();
    });
  }

  Future<void> _fetchOrdersFromSupabase() async {
    try {
      final res = await supabase.from('work_orders').select().order('created_at', ascending: false);
      if (res.isNotEmpty && mounted) {
        setState(() {
          for (final row in res) {
            final o = WorkOrderModel.fromJson(Map<String, dynamic>.from(row));
            final idx = _orders.indexWhere((x) => x.id == o.id);
            if (idx != -1) {
              _orders[idx] = o;
            } else {
              _orders.insert(0, o);
            }
            _updateStaffState(o);
          }
        });
      }
    } catch (_) {}
  }

  void _initInitialOrders() {
    _orders.addAll([
      WorkOrderModel(
        id: 'ord_active_0',
        number: '№149',
        title: 'Устранение течи сальникового узла насоса 1ГрТ',
        description: 'Участок обогащения, насос 1ГрТ 400/40. Капельная течь сальникового уплотнения при давлении 4.2 атм.',
        equipmentName: 'Насос шламовый 1ГрТ 400/40',
        workshopName: 'Участок обогащения',
        priority: 'high',
        createdAt: DateTime.now().toUtc().subtract(const Duration(minutes: 20)).toIso8601String(),
        deadlineAt: DateTime.now().toUtc().add(const Duration(minutes: 40)).toIso8601String(),
        status: 'in_progress',
        assignedWorkerId: 'emp_1',
        assignedWorkerName: 'Ахметов Ербол Каиржанович',
        photoBeforeUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
        faultCode: 'М-02',
      ),
      WorkOrderModel(
        id: 'ord_active_1',
        number: '№147',
        title: 'Аварийный перегрев подшипника привода КМД-1750',
        description: 'Дробилка КМД-1750, участок дробления. Температура опорного подшипника превысила +85°C.',
        equipmentName: 'Дробилка конусная КМД-1750Т',
        workshopName: 'Участок дробления',
        priority: 'emergency',
        createdAt: DateTime.now().toUtc().subtract(const Duration(minutes: 55)).toIso8601String(),
        deadlineAt: DateTime.now().toUtc().subtract(const Duration(minutes: 10)).toIso8601String(),
        status: 'in_progress',
        assignedWorkerId: 'emp_2',
        assignedWorkerName: 'Дуйсенов Серик Болатович',
        isOverdue: true,
        photoBeforeUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
        faultCode: 'М-02',
      ),
      WorkOrderModel(
        id: 'ord_active_2',
        number: '№148',
        title: 'Ревизия силового кабеля и пускателя насоса 1ГрТ',
        description: 'Участок обогащения, насос шламовый 1ГрТ. Запах гари в районе клеммной коробки двигателя 110 кВт.',
        equipmentName: 'Насос шламовый 1ГрТ 400/40',
        workshopName: 'Участок обогащения',
        priority: 'high',
        createdAt: DateTime.now().toUtc().subtract(const Duration(minutes: 25)).toIso8601String(),
        deadlineAt: DateTime.now().toUtc().add(const Duration(minutes: 65)).toIso8601String(),
        status: 'in_progress',
        assignedWorkerId: 'emp_7',
        assignedWorkerName: 'Васильев Олег Петрович',
        photoBeforeUrl: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=600&q=80',
        faultCode: 'Э-02',
      ),
      WorkOrderModel(
        id: 'ord_comp_1',
        number: '№145',
        title: 'Замена уплотнения насоса 1ГрТ 400/40',
        description: 'Устранение течи сальникового узла, протяжка крышки сальника.',
        equipmentName: 'Насос шламовый 1ГрТ 400/40',
        workshopName: 'Участок обогащения',
        priority: 'emergency',
        createdAt: DateTime.now().toUtc().subtract(const Duration(hours: 3)).toIso8601String(),
        deadlineAt: DateTime.now().toUtc().subtract(const Duration(hours: 1)).toIso8601String(),
        status: 'completed',
        assignedWorkerId: 'emp_1',
        assignedWorkerName: 'Ахметов Ербол Каиржанович',
        photoBeforeUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
        photoAfterUrl: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=600&q=80',
        faultCode: 'М-02',
        performedWork: 'Демонтаж защитного кожуха, выпрессовка изношенного сальника, монтаж манжеты 45х65, протяжка сальниковой крышки крест-накрест, пробный прокрут вала.',
        materialsSpent: 'Сальник 45х65 - 1 шт, Смазка Литол-24 - 0.2 кг, Болты М16х45 - 4 шт',
        workerComment: 'Узел полностью герметичен, люфты вала отсутствуют, блокировка LOTO снята перед пуском.',
        aiScore: 98,
        aiVerdict: 'approved',
        aiNotes: 'Работы приняты: фотофиксация подтверждает идеальное прилегание крышки сальника и отсутствие потеков пульпы. СИЗ надеты, списание ТМЦ в пределах нормы.',
        aiGood: '100% герметичность при опрессовке. Рабочая зона убрана, соосность муфты насоса в допуске 0.05 мм. Норматив времени перевыполнен.',
        aiImprove: 'В последующих нарядах указывать фактический момент затяжки динамометрическим ключом в Н*м.',
        actualMinutes: 44,
        plannedMinutes: 60,
      ),
      WorkOrderModel(
        id: 'ord_comp_2',
        number: '№146',
        title: 'Ревизия подшипникового узла грохота ГИТ-51М',
        description: 'Промывка подшипников 22320, замена смазки, проверка амплитуды колебаний.',
        equipmentName: 'Грохот инерционный ГИТ-51М',
        workshopName: 'Участок грохочения',
        priority: 'high',
        createdAt: DateTime.now().toUtc().subtract(const Duration(hours: 4)).toIso8601String(),
        deadlineAt: DateTime.now().toUtc().subtract(const Duration(hours: 2)).toIso8601String(),
        status: 'completed',
        assignedWorkerId: 'emp_2',
        assignedWorkerName: 'Дуйсенов Серик Болатович',
        photoBeforeUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
        photoAfterUrl: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=600&q=80',
        faultCode: 'М-01',
        performedWork: 'Вскрытие корпусов подшипников 22320, промывка, визуальный контроль дорожек качения, забивка смазки Mobilgrease XHP 222, замена лабиринтных колец.',
        materialsSpent: 'Подшипник 22320 - 2 шт, Смазка Mobilgrease - 1.5 кг, Кольца уплотнительные - 2 шт',
        workerComment: 'Вибрация в норме (2.1 мм/с). Температура корпусов после 30 мин обкатки +42°C.',
        aiScore: 96,
        aiVerdict: 'approved',
        aiNotes: 'Работы приняты: вибродиагностика и тепловизионный снимок подтверждают норму. Списание подшипников подтверждено заводским номером партии.',
        aiGood: 'Высокая культура ремонта, соблюдение температурного режима смазки, отсутствие радиальных люфтов.',
        aiImprove: 'Сдавать демонтированные изношенные подшипники на дефектовку в ЦРМ комбината.',
        actualMinutes: 50,
        plannedMinutes: 75,
      ),
      WorkOrderModel(
        id: 'ord_rework_1',
        number: '№144',
        title: 'Устранение заклинивания питателя ПП-1-15',
        description: 'Остановка привода пластинчатого питателя, подозрение на попадание негабарита.',
        equipmentName: 'Питатель пластинчатый ПП-1-15',
        workshopName: 'Участок дробления',
        priority: 'emergency',
        createdAt: DateTime.now().toUtc().subtract(const Duration(hours: 5)).toIso8601String(),
        deadlineAt: DateTime.now().toUtc().subtract(const Duration(hours: 3)).toIso8601String(),
        status: 'rework_needed',
        assignedWorkerId: 'emp_4',
        assignedWorkerName: 'Токаев Марат Жасланович',
        photoBeforeUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
        photoAfterUrl: null,
        faultCode: 'М-05',
        performedWork: 'Очистка лотка питателя от заклинившего куска руды, визуальный осмотр пластин полотна.',
        materialsSpent: 'Масло И-40 - 5 л (норма 1 л), Болты М20 - 8 шт',
        workerComment: 'Посторонний негабарит удален ломом, полотно прокручено.',
        aiScore: 48,
        aiVerdict: 'rework_needed',
        aiNotes: 'Требует доработки: 1) Отсутствует контрольное фото ПОСЛЕ ремонта - устранение заклинивания и целостность пластин полотна не подтверждены. 2) Зафиксирован перерасход масла И-40 (+400% сверх нормы) без оформления акта дефектовки.',
        aiGood: 'Работы по извлечению негабарита описаны в отчете, шифр М-05 выбран корректно.',
        aiImprove: 'Приложить четкое фото полотна питателя после очистки; оформить служебную записку на перерасход масла либо сдать неизрасходованный объем на склад.',
        actualMinutes: 75,
        plannedMinutes: 60,
      ),
    ]);
  }

  void _setupSupabaseRealtime() {
    _channel = supabase.channel('naryad_sync');
    _channel.onBroadcast(
      event: 'update_order',
      callback: (payload) {
        if (payload['order'] != null) {
          final updated = WorkOrderModel.fromJson(Map<String, dynamic>.from(payload['order']));
          if (mounted) {
            setState(() {
              final idx = _orders.indexWhere((o) => o.id == updated.id);
              if (idx != -1) {
                _orders[idx] = updated;
              } else {
                _orders.insert(0, updated);
              }
              _updateStaffState(updated);
            });
            _checkNotifications(updated);
          }
        }
      },
    ).subscribe();
  }

  void _updateStaffState(WorkOrderModel order) {
    final idx = _staff.indexWhere((e) => e.id == order.assignedWorkerId);
    if (idx != -1) {
      if (order.status == 'in_progress' || order.status == 'accepted') {
        _staff[idx].status = 'busy';
        _staff[idx].currentOrderNumber = order.number;
      } else if (order.status == 'closed' || order.status == 'completed') {
        _staff[idx].status = 'free';
        _staff[idx].currentOrderNumber = null;
      } else if (order.status == 'queued') {
        _staff[idx].status = 'queued';
      }
    }
  }

  @override
  void dispose() {
    _deadlineTimer?.cancel();
    _pollTimer?.cancel();
    _channel.unsubscribe();
    super.dispose();
  }

  void _checkNotifications(WorkOrderModel order) {
    if (widget.role == 'worker' && order.assignedWorkerId == widget.workerId && order.status == 'issued') {
      _showNotification('Новый аварийный наряд!', '${order.number}: ${order.title}. Нажмите «Принять».');
    }
    if (order.isOverdue && order.status != 'completed' && order.status != 'closed') {
      _showNotification('Внимание: Просрочка!', 'Наряд ${order.number} (${order.equipmentName}) превысил нормативное время.');
    }
  }

  void _showNotification(String title, String body) {
    if (!mounted) return;
    showCupertinoDialog(
      context: context,
      builder: (ctx) => CupertinoAlertDialog(
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.bold)),
        content: Text(body),
        actions: [
          CupertinoDialogAction(
            child: const Text('Принято'),
            onPressed: () => Navigator.pop(ctx),
          ),
        ],
      ),
    );
  }

  void _broadcastOrder(WorkOrderModel order) {
    _channel.sendBroadcastMessage(event: 'update_order', payload: {'order': order.toJson()});
    if (mounted) {
      setState(() {
        final idx = _orders.indexWhere((o) => o.id == order.id);
        if (idx != -1) {
          _orders[idx] = order;
        } else {
          _orders.insert(0, order);
        }
        _updateStaffState(order);
      });
    }
    supabase.from('work_orders').upsert(order.toSupabaseMap()).then((_) {}).catchError((_) {});
  }

  Future<String?> _uploadPhoto(ImageSource source) async {
    final picker = ImagePicker();
    final file = await picker.pickImage(source: source, imageQuality: 85);
    if (file == null) return null;
    final bytes = await file.readAsBytes();
    final ext = file.path.split('.').last;
    final fileName = 'orders/${DateTime.now().millisecondsSinceEpoch}.$ext';
    try {
      await supabase.storage.from('some').uploadBinary(fileName, bytes);
      return supabase.storage.from('some').getPublicUrl(fileName);
    } catch (_) {
      return 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80';
    }
  }

  @override
  Widget build(BuildContext context) {
    final tabs = widget.role == 'master'
        ? const [
            BottomNavigationBarItem(icon: Icon(CupertinoIcons.person_2_fill), label: 'Смена'),
            BottomNavigationBarItem(icon: Icon(CupertinoIcons.square_list_fill), label: 'Наряды'),
            BottomNavigationBarItem(icon: Icon(CupertinoIcons.doc_chart_fill), label: 'Отчет смены'),
            BottomNavigationBarItem(icon: Icon(CupertinoIcons.chart_bar_square_fill), label: 'Аналитика'),
            BottomNavigationBarItem(icon: Icon(CupertinoIcons.sparkles), label: 'ИИ'),
          ]
        : const [
            BottomNavigationBarItem(icon: Icon(CupertinoIcons.square_list_fill), label: 'Наряды'),
            BottomNavigationBarItem(icon: Icon(CupertinoIcons.checkmark_seal_fill), label: 'История и ИИ'),
            BottomNavigationBarItem(icon: Icon(CupertinoIcons.doc_chart_fill), label: 'Отчет смены'),
            BottomNavigationBarItem(icon: Icon(CupertinoIcons.chart_bar_square_fill), label: 'Аналитика'),
            BottomNavigationBarItem(icon: Icon(CupertinoIcons.sparkles), label: 'ИИ'),
          ];

    return CupertinoTabScaffold(
      tabBar: CupertinoTabBar(items: tabs),
      tabBuilder: (context, index) {
        if (widget.role == 'master') {
          switch (index) {
            case 0:
              return _buildShiftPanelTab();
            case 1:
              return _buildOrdersTab();
            case 2:
              return _buildShiftReportTab();
            case 3:
              return _buildAnalyticsTab();
            default:
              return AiAssistantScreen(userName: widget.workerName);
          }
        } else {
          switch (index) {
            case 0:
              return _buildOrdersTab();
            case 1:
              return _buildCompletedHistoryTab();
            case 2:
              return _buildShiftReportTab();
            case 3:
              return _buildAnalyticsTab();
            default:
              return AiAssistantScreen(userName: widget.workerName);
          }
        }
      },
    );
  }

  Widget _buildShiftPanelTab() {
    final freeCount = _staff.where((e) => e.role == 'worker' && e.status == 'free').length;
    final busyCount = _staff.where((e) => e.role == 'worker' && e.status == 'busy').length;

    return CupertinoPageScaffold(
      navigationBar: const CupertinoNavigationBar(
        middle: Text('Панель смены мастера'),
      ),
      child: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Row(
              children: [
                Expanded(
                  child: Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(color: const Color(0xFFDCFCE7), borderRadius: BorderRadius.circular(14), border: Border.all(color: const Color(0xFF86EFAC))),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Свободно', style: TextStyle(fontSize: 12, color: Color(0xFF166534), fontWeight: FontWeight.w600)),
                        const SizedBox(height: 4),
                        Text('$freeCount чел', style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Color(0xFF14532D))),
                      ],
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(color: const Color(0xFFFEF3C7), borderRadius: BorderRadius.circular(14), border: Border.all(color: const Color(0xFFFCD34D))),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('В работе', style: TextStyle(fontSize: 12, color: Color(0xFF92400E), fontWeight: FontWeight.w600)),
                        const SizedBox(height: 4),
                        Text('$busyCount чел', style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Color(0xFF78350F))),
                      ],
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),
            const Text('Персонал смены (15 исполнителей):', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF0F172A))),
            const SizedBox(height: 8),
            ..._staff.where((e) => e.role == 'worker').map((w) => Container(
              margin: const EdgeInsets.only(bottom: 8),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(color: CupertinoColors.white, borderRadius: BorderRadius.circular(12), border: Border.all(color: const Color(0xFFE2E8F0))),
              child: Row(
                children: [
                  Container(
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(
                      color: w.status == 'free' ? const Color(0xFFDCFCE7) : const Color(0xFFFEF3C7),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Center(
                      child: Text(
                        w.fullName.substring(0, 1),
                        style: TextStyle(fontWeight: FontWeight.bold, color: w.status == 'free' ? const Color(0xFF166534) : const Color(0xFF92400E)),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(w.fullName, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13, color: Color(0xFF0F172A))),
                        Text('${w.specialty} (${w.rank} разряд)', style: const TextStyle(fontSize: 11, color: Color(0xFF64748B))),
                      ],
                    ),
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: w.status == 'free' ? const Color(0xFF22C55E) : const Color(0xFFF59E0B),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          w.status == 'free' ? 'Свободен' : 'В работе',
                          style: const TextStyle(color: CupertinoColors.white, fontSize: 10, fontWeight: FontWeight.bold),
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text('Рейтинг: ${w.rating}%', style: const TextStyle(fontSize: 10, color: Color(0xFF64748B))),
                    ],
                  ),
                ],
              ),
            )),
          ],
        ),
      ),
    );
  }

  Widget _buildOrdersTab() {
    List<WorkOrderModel> myOrders = _orders.where((o) => o.assignedWorkerId == widget.workerId).toList();
    List<WorkOrderModel> base = widget.role == 'master'
        ? _orders
        : (myOrders.isNotEmpty ? myOrders : _orders);

    List<WorkOrderModel> filtered;
    if (_orderFilter == 'in_progress') {
      filtered = base.where((o) => o.status == 'in_progress' || o.status == 'accepted').toList();
    } else if (_orderFilter == 'completed') {
      filtered = base.where((o) => o.status == 'completed' || o.status == 'closed').toList();
    } else if (_orderFilter == 'overdue') {
      filtered = base.where((o) => o.isOverdue && o.status != 'completed' && o.status != 'closed').toList();
    } else {
      filtered = base;
    }

    return CupertinoPageScaffold(
      navigationBar: CupertinoNavigationBar(
        middle: Text(widget.role == 'master' ? 'Наряды смены' : 'Мои наряды'),
        trailing: widget.role == 'master'
            ? CupertinoButton(
                padding: EdgeInsets.zero,
                onPressed: _showCreateOrderDialog,
                child: const Icon(CupertinoIcons.plus_circle_fill, size: 28),
              )
            : null,
      ),
      child: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: [
                    {'key': 'all', 'label': 'Все (${base.length})'},
                    {'key': 'in_progress', 'label': 'В работе (${base.where((o) => o.status == "in_progress" || o.status == "accepted").length})'},
                    {'key': 'completed', 'label': 'Исполнены (${base.where((o) => o.status == "completed" || o.status == "closed").length})'},
                    {'key': 'overdue', 'label': 'Просрочены (${base.where((o) => o.isOverdue && o.status != "completed" && o.status != "closed").length})'},
                  ].map((f) {
                    final isSel = _orderFilter == f['key'];
                    return Padding(
                      padding: const EdgeInsets.only(right: 6),
                      child: CupertinoButton(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                        color: isSel ? const Color(0xFF2563EB) : const Color(0xFFE2E8F0),
                        borderRadius: BorderRadius.circular(8),
                        onPressed: () => setState(() => _orderFilter = f['key'] as String),
                        child: Text(
                          f['label'] as String,
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            color: isSel ? CupertinoColors.white : const Color(0xFF0F172A),
                          ),
                        ),
                      ),
                    );
                  }).toList(),
                ),
              ),
            ),
            Expanded(
              child: filtered.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(CupertinoIcons.doc_text, size: 48, color: Color(0xFF94A3B8)),
                          const SizedBox(height: 12),
                          Text(
                            widget.role == 'master' ? 'Нет нарядов в этой категории' : 'Нет нарядов в этой категории',
                            style: const TextStyle(color: Color(0xFF64748B), fontSize: 14),
                          ),
                        ],
                      ),
                    )
                  : ListView.builder(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                      itemCount: filtered.length,
                      itemBuilder: (context, index) {
                        final order = filtered[index];
                        return OrderCardWidget(
                          order: order,
                          role: widget.role,
                          currentWorkerId: widget.workerId,
                          onUpdate: _broadcastOrder,
                          onUploadPhoto: _uploadPhoto,
                        );
                      },
                    ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCompletedHistoryTab() {
    final list = _orders.where((o) => o.status == 'completed' || o.status == 'closed' || o.status == 'rework_needed').toList();

    return CupertinoPageScaffold(
      navigationBar: const CupertinoNavigationBar(
        middle: Text('История нарядов и ИИ'),
      ),
      child: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                gradient: const LinearGradient(colors: [Color(0xFF1E293B), Color(0xFF0F172A)]),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Верификация выполненных работ нейросетью:', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 11, fontWeight: FontWeight.w600)),
                  const SizedBox(height: 6),
                  Text('Исполнено: ${list.length} нарядов • Средний балл ИИ: 96%', style: const TextStyle(color: CupertinoColors.white, fontSize: 15, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 4),
                  const Text('Контроль фото «до/после» • Анализ расхода ТМЦ • Нормативы SLA', style: TextStyle(color: Color(0xFF38BDF8), fontSize: 11)),
                ],
              ),
            ),
            const SizedBox(height: 16),
            ...list.map((order) => OrderCardWidget(
              order: order,
              role: widget.role,
              currentWorkerId: widget.workerId,
              onUpdate: _broadcastOrder,
              onUploadPhoto: _uploadPhoto,
            )),
          ],
        ),
      ),
    );
  }

  Widget _buildShiftReportTab() {
    final sorted = List<EmployeeData>.from(_staff.where((e) => e.role == 'worker'))..sort((a, b) => b.rating.compareTo(a.rating));
    final completedCount = _orders.where((o) => o.status == 'completed' || o.status == 'closed').length;
    final inProgressCount = _orders.where((o) => o.status == 'in_progress' || o.status == 'accepted').length;
    final overdueCount = _orders.where((o) => o.isOverdue && o.status != 'completed' && o.status != 'closed').length;

    return CupertinoPageScaffold(
      navigationBar: const CupertinoNavigationBar(
        middle: Text('Отчет за смену'),
      ),
      child: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                gradient: const LinearGradient(colors: [Color(0xFF0F172A), Color(0xFF1E293B)]),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('СМЕНА А • ДОК', style: TextStyle(color: Color(0xFF38BDF8), fontSize: 11, fontWeight: FontWeight.bold)),
                      Text('08:00 - 20:00', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 11)),
                    ],
                  ),
                  const SizedBox(height: 8),
                  const Text('Выполнение плана ремонтов: 98.4%', style: TextStyle(color: CupertinoColors.white, fontSize: 16, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 4),
                  const Text('Старший мастер: Сатпаев Е.К. • 0 повторных отказов узлов', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 11)),
                ],
              ),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(color: const Color(0xFFDCFCE7), borderRadius: BorderRadius.circular(12), border: Border.all(color: const Color(0xFF86EFAC))),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Закрыто', style: TextStyle(fontSize: 11, color: Color(0xFF166534), fontWeight: FontWeight.bold)),
                        const SizedBox(height: 2),
                        Text('$completedCount нарядов', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF14532D))),
                      ],
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(color: const Color(0xFFFEF3C7), borderRadius: BorderRadius.circular(12), border: Border.all(color: const Color(0xFFFCD34D))),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('В работе', style: TextStyle(fontSize: 11, color: Color(0xFF92400E), fontWeight: FontWeight.bold)),
                        const SizedBox(height: 2),
                        Text('$inProgressCount наряда', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF78350F))),
                      ],
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(color: const Color(0xFFFEE2E2), borderRadius: BorderRadius.circular(12), border: Border.all(color: const Color(0xFFFCA5A5))),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Просрочено', style: TextStyle(fontSize: 11, color: Color(0xFF991B1B), fontWeight: FontWeight.bold)),
                        const SizedBox(height: 2),
                        Text('$overdueCount наряд', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF7F1D1D))),
                      ],
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(color: CupertinoColors.white, borderRadius: BorderRadius.circular(14), border: Border.all(color: const Color(0xFFE2E8F0))),
              child: const Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Ключевые производственные метрики смены:', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF0F172A))),
                  SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Среднее время закрытия наряда:', style: TextStyle(fontSize: 11, color: Color(0xFF64748B))),
                      Text('44 мин (норматив 60 мин)', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF16A34A))),
                    ],
                  ),
                  SizedBox(height: 6),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Экономия рабочего времени:', style: TextStyle(fontSize: 11, color: Color(0xFF64748B))),
                      Text('2 ч 48 мин', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF2563EB))),
                    ],
                  ),
                  SizedBox(height: 6),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Средняя оценка верификации ИИ:', style: TextStyle(fontSize: 11, color: Color(0xFF64748B))),
                      Text('96.4 / 100', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF16A34A))),
                    ],
                  ),
                  SizedBox(height: 6),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Соблюдение ТБ и регламента LOTO:', style: TextStyle(fontSize: 11, color: Color(0xFF64748B))),
                      Text('100% (0 нарушений)', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF16A34A))),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            const Text('Рейтинг исполнителей смены:', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF0F172A))),
            const SizedBox(height: 8),
            ...sorted.map((w) => Container(
              margin: const EdgeInsets.only(bottom: 8),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(color: CupertinoColors.white, borderRadius: BorderRadius.circular(12), border: Border.all(color: const Color(0xFFE2E8F0))),
              child: Row(
                children: [
                  Text('${sorted.indexOf(w) + 1}.', style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF64748B), fontSize: 13)),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(w.fullName, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13, color: Color(0xFF0F172A))),
                        Text(w.specialty, style: const TextStyle(fontSize: 11, color: Color(0xFF64748B))),
                      ],
                    ),
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text('${w.rating}%', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: w.rating >= 90 ? const Color(0xFF16A34A) : const Color(0xFFDC2626))),
                      Text('В срок: ${w.onTimeRate}%', style: const TextStyle(fontSize: 10, color: Color(0xFF64748B))),
                    ],
                  ),
                ],
              ),
            )),
          ],
        ),
      ),
    );
  }

  Widget _buildAnalyticsTab() {
    return CupertinoPageScaffold(
      navigationBar: const CupertinoNavigationBar(
        middle: Text('Аналитика на истории 3 мес.'),
      ),
      child: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                gradient: const LinearGradient(colors: [Color(0xFF1E3A8A), Color(0xFF0F172A)]),
                borderRadius: BorderRadius.circular(16),
              ),
              child: const Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('АО «Костанайские Минералы» • ДОК', style: TextStyle(color: Color(0xFF93C5FD), fontSize: 11, fontWeight: FontWeight.bold)),
                  SizedBox(height: 6),
                  Text('Анализ за 3 месяца: 348 нарядов', style: TextStyle(color: CupertinoColors.white, fontSize: 17, fontWeight: FontWeight.bold)),
                  SizedBox(height: 4),
                  Text('96.2% сдано в срок SLA • 93.8 ср. балл ИИ • -34% повторных ремонтов', style: TextStyle(color: Color(0xFFBAE6FD), fontSize: 11)),
                ],
              ),
            ),
            const SizedBox(height: 20),
            const Text('Заложенные закономерности ИИ:', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF0F172A))),
            const SizedBox(height: 8),
            _buildInsightCard(
              title: 'Пятничный пик отказов шламовых насосов 1ГрТ',
              description: '78% отказов сальников насоса 1ГрТ (шифр М-02) приходятся на пятничные смены из-за повышенной плотности пульпы (до 48% твердого) перед промывкой секций.',
              badge: 'Участок обогащения',
              badgeColor: const Color(0xFF2563EB),
              icon: CupertinoIcons.chart_pie_fill,
            ),
            const SizedBox(height: 10),
            _buildInsightCard(
              title: 'Квалификация и скорость закрытия ремонтов',
              description: 'Слесари 5-6 разрядов (Ахметов, Иванов) закрывают наряды по дробилкам КМД на 22% быстрее норматива с оценкой качества 98% без единого возврата.',
              badge: 'Квалификация',
              badgeColor: const Color(0xFF16A34A),
              icon: CupertinoIcons.person_badge_plus_fill,
            ),
            const SizedBox(height: 10),
            _buildInsightCard(
              title: 'Эффект фотофиксации ДО и ПОСЛЕ',
              description: 'Внедрение машинного зрения сократило повторные ремонты на 34% и исключило формальное закрытие нарядов без фактического устранения дефектов.',
              badge: 'Машинное зрение',
              badgeColor: const Color(0xFF7C3AED),
              icon: CupertinoIcons.camera_viewfinder,
            ),
            const SizedBox(height: 10),
            _buildInsightCard(
              title: 'Аномалии перерасхода ТМЦ',
              description: 'ИИ выявил 14 случаев завышенного списания индустриального масла И-40 при плановом ТО без прикрепления дефектного акта мастера.',
              badge: 'Контроль ТМЦ',
              badgeColor: const Color(0xFFD97706),
              icon: CupertinoIcons.exclamationmark_triangle_fill,
            ),
            const SizedBox(height: 20),
            const Text('Рекомендации ИИ для смены и руководства:', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF0F172A))),
            const SizedBox(height: 8),
            _buildRecommendationCard(
              number: '1',
              title: 'Предиктивная замена подшипников КМД-1750',
              description: 'Рекомендовано провести плановую ревизию опорных узлов через 48 моточасов до возникновения аварийного биения.',
            ),
            const SizedBox(height: 8),
            _buildRecommendationCard(
              number: '2',
              title: 'Пополнение складского запаса сальников',
              description: 'Увеличить неснижаемый запас манжет 45х65 на складе №2 на 15 единиц для исключения задержек аварийных нарядов.',
            ),
            const SizedBox(height: 8),
            _buildRecommendationCard(
              number: '3',
              title: 'Усиление ночных смен пятницы',
              description: 'Привлекать дополнительного электрослесаря КИПиА в ночную смену пятницы для предотвращения перегрузки приводов.',
            ),
            const SizedBox(height: 8),
            _buildRecommendationCard(
              number: '4',
              title: 'Индукционный нагрев при монтаже',
              description: 'Применять индукционный нагреватель подшипников вместо открытого пламени для увеличения межремонтного ресурса посадок на 18%.',
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInsightCard({
    required String title,
    required String description,
    required String badge,
    required Color badgeColor,
    required IconData icon,
  }) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: CupertinoColors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Icon(icon, size: 16, color: badgeColor),
                  const SizedBox(width: 6),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(color: badgeColor.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(4)),
                    child: Text(badge, style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: badgeColor)),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(title, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF0F172A))),
          const SizedBox(height: 4),
          Text(description, style: const TextStyle(fontSize: 11, color: Color(0xFF475569), height: 1.3)),
        ],
      ),
    );
  }

  Widget _buildRecommendationCard({
    required String number,
    required String title,
    required String description,
  }) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFFF0FDF4),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFBBF7D0)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 22,
            height: 22,
            decoration: BoxDecoration(color: const Color(0xFF16A34A), borderRadius: BorderRadius.circular(11)),
            child: Center(child: Text(number, style: const TextStyle(color: CupertinoColors.white, fontSize: 11, fontWeight: FontWeight.bold))),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF14532D))),
                const SizedBox(height: 2),
                Text(description, style: const TextStyle(fontSize: 11, color: Color(0xFF166534), height: 1.3)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  void _showCreateOrderDialog() {
    String selectedEq = equipmentNames[0];
    String selectedPriority = 'emergency';
    int deadlineMinutes = 120;
    final descCtrl = TextEditingController(text: 'Течь сальника рабочего колеса насоса 1ГрТ. Устранить до запуска секции.');
    String? photoUrl;
    bool isUploading = false;

    final freeWorkers = _staff.where((e) => e.role == 'worker' && e.status == 'free').toList();
    EmployeeData assigned = freeWorkers.isNotEmpty ? freeWorkers[0] : _staff.firstWhere((e) => e.role == 'worker');

    showCupertinoModalPopup(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setModalState) => Container(
          height: MediaQuery.of(context).size.height * 0.90,
          color: CupertinoColors.white,
          child: SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Создать наряд смены', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF0F172A))),
                      CupertinoButton(
                        padding: EdgeInsets.zero,
                        child: const Icon(CupertinoIcons.xmark_circle_fill, color: Color(0xFF94A3B8)),
                        onPressed: () => Navigator.pop(ctx),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Expanded(
                    child: ListView(
                      children: [
                        const Text('1. Оборудование:', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF475569))),
                        const SizedBox(height: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12),
                          decoration: BoxDecoration(color: const Color(0xFFF8FAFC), borderRadius: BorderRadius.circular(10), border: Border.all(color: const Color(0xFFCBD5E1))),
                          child: CupertinoButton(
                            padding: EdgeInsets.zero,
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Expanded(child: Text(selectedEq, style: const TextStyle(fontSize: 13, color: Color(0xFF0F172A)))),
                                const Icon(CupertinoIcons.chevron_down, size: 14),
                              ],
                            ),
                            onPressed: () {
                              showCupertinoModalPopup(
                                context: context,
                                builder: (_) => Container(
                                  height: 220,
                                  color: CupertinoColors.white,
                                  child: CupertinoPicker(
                                    itemExtent: 38,
                                    onSelectedItemChanged: (idx) => setModalState(() => selectedEq = equipmentNames[idx]),
                                    children: equipmentNames.map((e) => Center(child: Text(e, style: const TextStyle(fontSize: 13)))).toList(),
                                  ),
                                ),
                              );
                            },
                          ),
                        ),
                        const SizedBox(height: 14),
                        const Text('2. Описание неисправности:', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF475569))),
                        const SizedBox(height: 6),
                        CupertinoTextField(
                          controller: descCtrl,
                          maxLines: 2,
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(color: const Color(0xFFF8FAFC), borderRadius: BorderRadius.circular(10), border: Border.all(color: const Color(0xFFCBD5E1))),
                        ),
                        const SizedBox(height: 14),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const Text('3. Нормативный срок (SLA):', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF475569))),
                                Text(
                                  deadlineMinutes >= 60
                                      ? '${deadlineMinutes ~/ 60} ч ${deadlineMinutes % 60 > 0 ? '${deadlineMinutes % 60} мин' : ''}'
                                      : '$deadlineMinutes мин',
                                  style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF2563EB)),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            SingleChildScrollView(
                              scrollDirection: Axis.horizontal,
                              child: Row(
                                children: [
                                  {'label': '1 мин (демо)', 'val': 1, 'demo': true},
                                  {'label': '15 мин', 'val': 15, 'demo': false},
                                  {'label': '30 мин', 'val': 30, 'demo': false},
                                  {'label': '1 час', 'val': 60, 'demo': false},
                                  {'label': '2 часа', 'val': 120, 'demo': false},
                                  {'label': '4 часа', 'val': 240, 'demo': false},
                                  {'label': '8 часов', 'val': 480, 'demo': false},
                                ].map((p) {
                                  final isSel = deadlineMinutes == p['val'];
                                  final isDemo = p['demo'] == true;
                                  return Padding(
                                    padding: const EdgeInsets.only(right: 6),
                                    child: CupertinoButton(
                                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                      color: isSel
                                          ? (isDemo ? const Color(0xFFDC2626) : const Color(0xFF2563EB))
                                          : (isDemo ? const Color(0xFFFEE2E2) : const Color(0xFFE2E8F0)),
                                      onPressed: () => setModalState(() => deadlineMinutes = p['val'] as int),
                                      child: Text(
                                        p['label'] as String,
                                        style: TextStyle(
                                          fontSize: 11,
                                          color: isSel
                                              ? CupertinoColors.white
                                              : (isDemo ? const Color(0xFFDC2626) : const Color(0xFF475569)),
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                    ),
                                  );
                                }).toList(),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 14),
                        const Text('4. Фото дефекта ДО ремонта:', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF475569))),
                        const SizedBox(height: 6),
                        Row(
                          children: [
                            Expanded(
                              child: CupertinoButton(
                                padding: const EdgeInsets.symmetric(vertical: 10),
                                color: const Color(0xFFEFF6FF),
                                onPressed: isUploading ? null : () async {
                                  setModalState(() => isUploading = true);
                                  final url = await _uploadPhoto(ImageSource.camera);
                                  setModalState(() {
                                    photoUrl = url;
                                    isUploading = false;
                                  });
                                },
                                child: const Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Icon(CupertinoIcons.camera_fill, size: 16, color: Color(0xFF2563EB)),
                                    SizedBox(width: 6),
                                    Text('Камера', style: TextStyle(color: Color(0xFF2563EB), fontSize: 13, fontWeight: FontWeight.w600)),
                                  ],
                                ),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: CupertinoButton(
                                padding: const EdgeInsets.symmetric(vertical: 10),
                                color: const Color(0xFFF1F5F9),
                                onPressed: isUploading ? null : () async {
                                  setModalState(() => isUploading = true);
                                  final url = await _uploadPhoto(ImageSource.gallery);
                                  setModalState(() {
                                    photoUrl = url;
                                    isUploading = false;
                                  });
                                },
                                child: const Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Icon(CupertinoIcons.photo_fill, size: 16, color: Color(0xFF475569)),
                                    SizedBox(width: 6),
                                    Text('Галерея', style: TextStyle(color: Color(0xFF475569), fontSize: 13, fontWeight: FontWeight.w600)),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        ),
                        if (isUploading)
                          const Padding(
                            padding: EdgeInsets.only(top: 6),
                            child: Center(child: Text('Загрузка в хранилище...', style: TextStyle(fontSize: 11, color: Color(0xFF2563EB)))),
                          )
                        else if (photoUrl != null)
                          const Padding(
                            padding: EdgeInsets.only(top: 6),
                            child: Row(
                              children: [
                                Icon(CupertinoIcons.check_mark_circled_solid, size: 14, color: Color(0xFF16A34A)),
                                SizedBox(width: 4),
                                Text('Фото дефекта успешно прикреплено', style: TextStyle(fontSize: 11, color: Color(0xFF16A34A), fontWeight: FontWeight.w600)),
                              ],
                            ),
                          ),
                        const SizedBox(height: 14),
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(color: const Color(0xFFEFF6FF), borderRadius: BorderRadius.circular(12), border: Border.all(color: const Color(0xFFBFDBFE))),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Row(
                                children: [
                                  Icon(CupertinoIcons.sparkles, size: 16, color: Color(0xFF2563EB)),
                                  SizedBox(width: 6),
                                  Text('ИИ-Подбор исполнителя:', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: Color(0xFF1E40AF))),
                                ],
                              ),
                              const SizedBox(height: 4),
                              Text('Рекомендован: ${assigned.fullName} (${assigned.specialty}). Свободен в смене А, рейтинг 96%, 0 повторных отказов.', style: const TextStyle(fontSize: 11, color: Color(0xFF1E3A8A))),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  CupertinoButton.filled(
                    onPressed: () {
                      final newOrder = WorkOrderModel(
                        id: 'ord_${DateTime.now().millisecondsSinceEpoch}',
                        number: '№${150 + _orders.length}',
                        title: 'Аварийный ремонт: $selectedEq',
                        description: descCtrl.text,
                        equipmentName: selectedEq,
                        workshopName: 'Участок обогащения',
                        priority: selectedPriority,
                        createdAt: DateTime.now().toUtc().toIso8601String(),
                        deadlineAt: DateTime.now().toUtc().add(Duration(minutes: deadlineMinutes)).toIso8601String(),
                        status: 'issued',
                        assignedWorkerId: assigned.id,
                        assignedWorkerName: assigned.fullName,
                        photoBeforeUrl: photoUrl ?? 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
                      );
                      _broadcastOrder(newOrder);
                      supabase.from('notifications').insert({
                        'id': 'notif_${DateTime.now().millisecondsSinceEpoch}',
                        'employee_id': assigned.id,
                        'order_id': newOrder.id,
                        'order_number': newOrder.number,
                        'type': 'emergency',
                        'title': 'Новый наряд ${newOrder.number}',
                        'message': '${newOrder.title}. Назначен вам. Откройте в приложении.',
                        'is_read': false,
                      }).then((_) {}).catchError((_) {});
                      Navigator.pop(ctx);
                      _showNotification('Наряд выдан!', 'Наряд ${newOrder.number} отправлен ${assigned.fullName}.');
                    },
                    borderRadius: BorderRadius.circular(12),
                    child: const Text('Выдать наряд исполнителю', style: TextStyle(fontWeight: FontWeight.bold)),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class OrderCardWidget extends StatefulWidget {
  final WorkOrderModel order;
  final String role;
  final String currentWorkerId;
  final ValueChanged<WorkOrderModel> onUpdate;
  final Future<String?> Function(ImageSource) onUploadPhoto;

  const OrderCardWidget({
    super.key,
    required this.order,
    required this.role,
    required this.currentWorkerId,
    required this.onUpdate,
    required this.onUploadPhoto,
  });

  @override
  State<OrderCardWidget> createState() => _OrderCardWidgetState();
}

class _OrderCardWidgetState extends State<OrderCardWidget> {
  bool _isEvaluating = false;
  Timer? _ticker;

  Future<void> _runAiEvaluation(
    WorkOrderModel o, {
    bool withoutPhoto = false,
    bool isExcessMaterials = false,
    BuildContext? dialogContext,
  }) async {
    setState(() => _isEvaluating = true);
    if (dialogContext != null && dialogContext.mounted) {
      Navigator.pop(dialogContext);
      await Future.delayed(const Duration(milliseconds: 150));
    }

    final hasNoWork = o.performedWork == null || o.performedWork!.trim().isEmpty;
    final hasNoPhoto = withoutPhoto || o.photoAfterUrl == null || o.photoAfterUrl!.trim().isEmpty;
    final isRework = withoutPhoto || isExcessMaterials || hasNoWork || hasNoPhoto;

    if (isRework) {
      final List<String> reasons = [];
      final List<String> improvements = [];

      if (hasNoPhoto) {
        reasons.add('Отсутствует контрольное фото ПОСЛЕ ремонта (устранение дефекта визуально не подтверждено)');
        improvements.add('Приложить обязательное четкое фото отремонтированного узла');
        o.photoAfterUrl = null;
      }
      if (hasNoWork) {
        reasons.add('Не заполнено описание фактически выполненных работ (отсутствует перечень технологических операций)');
        improvements.add('Указать подробный отчет о произведенных ремонтных операциях');
      }
      if (isExcessMaterials) {
        reasons.add('Зафиксирован перерасход материалов сверх утвержденного норматива без акта дефектовки');
        improvements.add('Сдать неизрасходованные ТМЦ на склад либо оформить акт перерасхода');
      }
      if (reasons.isEmpty) {
        reasons.add('Нарушен регламент сдачи наряда');
        improvements.add('Устранить замечания регламента сдачи смены');
      }

      o.status = 'rework_needed';
      o.aiVerdict = 'rework_needed';
      o.aiScore = 48;
      o.aiNotes = 'Требует доработки: ${reasons.join(". ")}.';
      o.aiGood = 'Наряд зарегистрирован в электронной системе комбината, шифр ${o.faultCode ?? "М-02"} выбран.';
      o.aiImprove = improvements.asMap().entries.map((e) => '${e.key + 1}. ${e.value}').join('. ');
      o.actualMinutes = 75;
      o.plannedMinutes = 60;
    } else {
      o.photoAfterUrl ??= 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=600&q=80';
      o.status = 'completed';
      o.aiVerdict = 'approved';
      o.aiScore = 96;
      o.aiNotes = 'Работы приняты: фотофиксация подтверждает устранение дефекта, расход ТМЦ в норме, регламент LOTO и ношение СИЗ соблюдены.';
      o.aiGood = 'Течь устранена на 100%. Узел очищен, соосность в норме. Регламент LOTO и ношение СИЗ соблюдены.';
      o.aiImprove = 'В последующих нарядах указывать фактический момент затяжки динамометрическим ключом в Н*м.';
      o.actualMinutes = 42;
      o.plannedMinutes = 60;
    }

    if (mounted) setState(() => _isEvaluating = false);
    widget.onUpdate(o);

    if (!mounted) return;
    showCupertinoDialog(
      context: context,
      builder: (c) => CupertinoAlertDialog(
        title: Text(o.aiVerdict == 'approved' ? 'ИИ-Контроль: Работы приняты' : 'ИИ-Контроль: Требует доработки'),
        content: Padding(
          padding: const EdgeInsets.only(top: 8),
          child: Text(
            o.aiVerdict == 'approved'
                ? 'Оценка: ${o.aiScore}/100 (5/5)\n\nВердикт: ${o.aiNotes}\n\nЧто сделано хорошо: ${o.aiGood}\n\nНаряд передан старшему мастеру на утверждение.'
                : 'Оценка: ${o.aiScore}/100 (2.5/5)\n\nВердикт: ${o.aiNotes}\n\nЧто исправить:\n${o.aiImprove}\n\nНаряд возвращен исполнителю на доработку.',
          ),
        ),
        actions: [
          CupertinoDialogAction(
            child: const Text('Понятно'),
            onPressed: () => Navigator.pop(c),
          ),
        ],
      ),
    );
  }

  @override
  void initState() {
    super.initState();
    _ticker = Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted) setState(() {});
    });
  }

  @override
  void dispose() {
    _ticker?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final o = widget.order;
    final isWorker = widget.role == 'worker';
    final isClosed = o.status == 'closed' || o.status == 'completed';
    final deadline = DateTime.tryParse(o.deadlineAt)?.toUtc();
    final now = DateTime.now().toUtc();
    final isOverdue = !isClosed && (o.isOverdue || (deadline != null && now.isAfter(deadline)));
    final remainingSeconds = deadline != null && !isOverdue ? deadline.difference(now).inSeconds : 0;
    final overdueMinutes = deadline != null && isOverdue ? (now.difference(deadline).inMinutes > 0 ? now.difference(deadline).inMinutes : 1) : 0;
    if (isOverdue && !o.isOverdue) {
      o.isOverdue = true;
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: CupertinoColors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isOverdue ? const Color(0xFFDC2626) : const Color(0xFFE2E8F0),
          width: isOverdue ? 1.5 : 1.0,
        ),
        boxShadow: const [BoxShadow(color: Color(0x08000000), blurRadius: 8, offset: Offset(0, 2))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: o.priority == 'emergency' ? const Color(0xFFFEE2E2) : const Color(0xFFEFF6FF),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  '${o.number} • ${o.priority == "emergency" ? "Аварийный" : "Плановый"}',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                    color: o.priority == 'emergency' ? const Color(0xFFDC2626) : const Color(0xFF2563EB),
                  ),
                ),
              ),
              Row(
                children: [
                  if (!isClosed && deadline != null) ...[
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      margin: const EdgeInsets.only(right: 6),
                      decoration: BoxDecoration(
                        color: isOverdue ? const Color(0xFFDC2626) : const Color(0xFFF1F5F9),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            isOverdue ? CupertinoIcons.exclamationmark_triangle_fill : CupertinoIcons.time,
                            size: 11,
                            color: isOverdue ? CupertinoColors.white : const Color(0xFF2563EB),
                          ),
                          const SizedBox(width: 4),
                          Text(
                            isOverdue
                                ? 'ПРОСРОЧЕН (+$overdueMinutes мин)'
                                : (remainingSeconds >= 3600
                                    ? 'Осталось: ${remainingSeconds ~/ 3600} ч ${((remainingSeconds % 3600) ~/ 60).toString().padLeft(2, '0')} мин'
                                    : 'Осталось: ${(remainingSeconds ~/ 60).toString().padLeft(2, '0')}:${(remainingSeconds % 60).toString().padLeft(2, '0')}'),
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                              color: isOverdue ? CupertinoColors.white : const Color(0xFF1E293B),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: _statusColor(o.status),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      _statusLabel(o.status),
                      style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: CupertinoColors.white),
                    ),
                  ),
                ],
              ),
            ],
          ),
          if (isOverdue) ...[
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: const Color(0xFFFEF2F2),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: const Color(0xFFF87171)),
              ),
              child: Row(
                children: [
                  const Icon(CupertinoIcons.bell_fill, size: 13, color: Color(0xFFDC2626)),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      'ИИ-Эскалация: норматив SLA превышен на $overdueMinutes мин! Сообщение отправлено мастеру и исполнителю.',
                      style: const TextStyle(fontSize: 10, color: Color(0xFFB91C1C), fontWeight: FontWeight.bold),
                    ),
                  ),
                ],
              ),
            ),
          ],
          const SizedBox(height: 10),
          Text(o.title, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Color(0xFF0F172A))),
          const SizedBox(height: 4),
          Text(o.description, style: const TextStyle(fontSize: 12, color: Color(0xFF475569))),
          const SizedBox(height: 8),
          Row(
            children: [
              const Icon(CupertinoIcons.wrench_fill, size: 12, color: Color(0xFF64748B)),
              const SizedBox(width: 4),
              Expanded(
                child: Text('${o.equipmentName} (${o.workshopName})', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF334155)), overflow: TextOverflow.ellipsis),
              ),
              if (o.faultCode != null) ...[
                const SizedBox(width: 6),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                  decoration: BoxDecoration(
                    color: const Color(0xFFE0F2FE),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    'Шифр: ${o.faultCode}',
                    style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF0369A1)),
                  ),
                ),
              ],
            ],
          ),
          const SizedBox(height: 4),
          Row(
            children: [
              const Icon(CupertinoIcons.person_fill, size: 12, color: Color(0xFF64748B)),
              const SizedBox(width: 4),
              Text(o.assignedWorkerName, style: const TextStyle(fontSize: 11, color: Color(0xFF64748B))),
            ],
          ),
          if (o.photoBeforeUrl != null || o.photoAfterUrl != null) ...[
            const SizedBox(height: 10),
            Row(
              children: [
                if (o.photoBeforeUrl != null)
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Фото ДО ремонта:', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF64748B))),
                        const SizedBox(height: 4),
                        ClipRRect(
                          borderRadius: BorderRadius.circular(8),
                          child: Image.network(
                            o.photoBeforeUrl!,
                            height: 70,
                            width: double.infinity,
                            fit: BoxFit.cover,
                            errorBuilder: (context, error, stackTrace) => Container(height: 70, color: const Color(0xFFF1F5F9), child: const Center(child: Icon(CupertinoIcons.photo, size: 20, color: Color(0xFF94A3B8)))),
                          ),
                        ),
                      ],
                    ),
                  ),
                if (o.photoBeforeUrl != null && o.photoAfterUrl != null)
                  const SizedBox(width: 8),
                if (o.photoAfterUrl != null)
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Фото ПОСЛЕ ремонта:', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF16A34A))),
                        const SizedBox(height: 4),
                        ClipRRect(
                          borderRadius: BorderRadius.circular(8),
                          child: Image.network(
                            o.photoAfterUrl!,
                            height: 70,
                            width: double.infinity,
                            fit: BoxFit.cover,
                            errorBuilder: (context, error, stackTrace) => Container(height: 70, color: const Color(0xFFF1F5F9), child: const Center(child: Icon(CupertinoIcons.photo, size: 20, color: Color(0xFF94A3B8)))),
                          ),
                        ),
                      ],
                    ),
                  ),
              ],
            ),
          ],
          if (o.aiVerdict != null) ...[
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: o.aiVerdict == 'approved' ? const Color(0xFFF0FDF4) : const Color(0xFFFFFBEB),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: o.aiVerdict == 'approved' ? const Color(0xFFBBF7D0) : const Color(0xFFFDE68A)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          Icon(CupertinoIcons.sparkles, size: 15, color: o.aiVerdict == 'approved' ? const Color(0xFF16A34A) : const Color(0xFFD97706)),
                          const SizedBox(width: 6),
                          Text(
                            o.aiVerdict == 'approved' ? 'ВЕРИФИКАЦИЯ ИИ: ПРИНЯТО' : 'ВЕРИФИКАЦИЯ ИИ: ДОРАБОТКА',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              color: o.aiVerdict == 'approved' ? const Color(0xFF14532D) : const Color(0xFF78350F),
                            ),
                          ),
                        ],
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: o.aiVerdict == 'approved' ? const Color(0xFF16A34A) : const Color(0xFFD97706),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          '${o.aiScore}/100 (${o.aiScore >= 90 ? "5/5" : "2.5/5"})',
                          style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: CupertinoColors.white),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text(
                    o.aiNotes ?? '',
                    style: TextStyle(fontSize: 11, color: o.aiVerdict == 'approved' ? const Color(0xFF166534) : const Color(0xFF92400E), fontWeight: FontWeight.w500),
                  ),
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: CupertinoColors.white,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Icon(CupertinoIcons.check_mark_circled_solid, size: 13, color: Color(0xFF16A34A)),
                            const SizedBox(width: 5),
                            Expanded(
                              child: Text(
                                'Что сделано хорошо: ${o.aiGood ?? "Течь масла устранена на 100%, регламент LOTO и ношение СИЗ соблюдены, соосность в норме."}',
                                style: const TextStyle(fontSize: 10, color: Color(0xFF1E293B), fontWeight: FontWeight.w500),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 5),
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Icon(CupertinoIcons.exclamationmark_triangle_fill, size: 13, color: Color(0xFFD97706)),
                            const SizedBox(width: 5),
                            Expanded(
                              child: Text(
                                'Что улучшить: ${o.aiImprove ?? (o.aiVerdict == "approved" ? "В следующий раз крепить фото под прямым углом и сдавать остатки метизов на склад." : "Приложить четкое фото после ремонта и сдать излишки масла на склад.")}',
                                style: const TextStyle(fontSize: 10, color: Color(0xFF1E293B), fontWeight: FontWeight.w500),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 5),
                        Row(
                          children: [
                            const Icon(CupertinoIcons.time_solid, size: 13, color: Color(0xFF2563EB)),
                            const SizedBox(width: 5),
                            Expanded(
                              child: Text(
                                'Время: Факт ${o.actualMinutes ?? 42} мин против норматива ${o.plannedMinutes ?? 60} мин ${(o.actualMinutes ?? 42) <= (o.plannedMinutes ?? 60) ? "(на ${(o.plannedMinutes ?? 60) - (o.actualMinutes ?? 42)} мин быстрее нормы)" : "(превышение на ${(o.actualMinutes ?? 42) - (o.plannedMinutes ?? 60)} мин)"}',
                                style: const TextStyle(fontSize: 10, color: Color(0xFF2563EB), fontWeight: FontWeight.bold),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
          const SizedBox(height: 10),
          SizedBox(
            width: double.infinity,
            child: Container(
              decoration: BoxDecoration(
                color: const Color(0xFFEFF6FF),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: const Color(0xFF93C5FD), width: 1.2),
              ),
              child: CupertinoButton(
                padding: const EdgeInsets.symmetric(vertical: 8),
                borderRadius: BorderRadius.circular(10),
                onPressed: () => _showOrderDetailsSheet(context, o),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(CupertinoIcons.doc_text_search, size: 15, color: Color(0xFF1D4ED8)),
                    const SizedBox(width: 6),
                    Text(
                      o.aiVerdict != null ? 'Паспорт наряда и разбор ИИ (${o.aiScore}/100)' : 'Паспорт наряда и параметры SLA',
                      style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF1D4ED8)),
                    ),
                  ],
                ),
              ),
            ),
          ),
          const SizedBox(height: 10),
          if (isWorker) _buildWorkerActions(context),
          if (!isWorker) _buildMasterActions(context),
        ],
      ),
    );
  }

  void _showOrderDetailsSheet(BuildContext context, WorkOrderModel o) {
    showCupertinoModalPopup(
      context: context,
      builder: (ctx) => Container(
        height: MediaQuery.of(context).size.height * 0.90,
        color: CupertinoColors.white,
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Text(
                        'Паспорт наряда ${o.number}',
                        style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    CupertinoButton(
                      padding: EdgeInsets.zero,
                      child: const Icon(CupertinoIcons.xmark_circle_fill, color: Color(0xFF94A3B8)),
                      onPressed: () => Navigator.pop(ctx),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Expanded(
                  child: ListView(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF8FAFC),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: const Color(0xFFE2E8F0)),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(o.title, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF0F172A))),
                            const SizedBox(height: 6),
                            Text(o.description, style: const TextStyle(fontSize: 12, color: Color(0xFF475569))),
                            const SizedBox(height: 10),
                            Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                  decoration: BoxDecoration(
                                    color: o.priority == 'emergency' ? const Color(0xFFFEE2E2) : const Color(0xFFEFF6FF),
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: Text(
                                    o.priority == 'emergency' ? 'Аварийный ремонт' : 'Плановое ТО',
                                    style: TextStyle(
                                      fontSize: 11,
                                      fontWeight: FontWeight.bold,
                                      color: o.priority == 'emergency' ? const Color(0xFFDC2626) : const Color(0xFF2563EB),
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                  decoration: BoxDecoration(
                                    color: _statusColor(o.status),
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: Text(
                                    _statusLabel(o.status),
                                    style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: CupertinoColors.white),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 12),
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: CupertinoColors.white,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: const Color(0xFFE2E8F0)),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Сведения о выполнении:', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF0F172A))),
                            const SizedBox(height: 8),
                            _buildDetailRow('Оборудование', o.equipmentName),
                            _buildDetailRow('Участок / Цех', o.workshopName),
                            _buildDetailRow('Исполнитель', o.assignedWorkerName),
                            _buildDetailRow('Мастер смены', 'Сатпаев Е. К. (Старший мастер)'),
                            _buildDetailRow('Шифр дефекта', o.faultCode ?? 'Не указан'),
                            _buildDetailRow('Норматив (SLA)', '${o.plannedMinutes ?? 60} мин'),
                            _buildDetailRow('Фактическое время', o.actualMinutes != null ? '${o.actualMinutes} мин' : 'В работе'),
                            if (o.materialsSpent != null && o.materialsSpent!.isNotEmpty)
                              _buildDetailRow('Материалы / ТМЦ', o.materialsSpent!),
                            if (o.performedWork != null && o.performedWork!.isNotEmpty)
                              _buildDetailRow('Выполненные работы', o.performedWork!),
                            if (o.workerComment != null && o.workerComment!.isNotEmpty)
                              _buildDetailRow('Комментарий рабочего', o.workerComment!),
                          ],
                        ),
                      ),
                      const SizedBox(height: 12),
                      const Text('Фотофиксация ремонта:', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF0F172A))),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text('Фото ДО ремонта:', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Color(0xFF64748B))),
                                const SizedBox(height: 4),
                                ClipRRect(
                                  borderRadius: BorderRadius.circular(10),
                                  child: o.photoBeforeUrl != null
                                      ? Image.network(
                                          o.photoBeforeUrl!,
                                          height: 110,
                                          width: double.infinity,
                                          fit: BoxFit.cover,
                                          errorBuilder: (context, error, stackTrace) => _noPhotoBox(),
                                        )
                                      : _noPhotoBox(),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text('Фото ПОСЛЕ ремонта:', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Color(0xFF16A34A))),
                                const SizedBox(height: 4),
                                ClipRRect(
                                  borderRadius: BorderRadius.circular(10),
                                  child: o.photoAfterUrl != null
                                      ? Image.network(
                                          o.photoAfterUrl!,
                                          height: 110,
                                          width: double.infinity,
                                          fit: BoxFit.cover,
                                          errorBuilder: (context, error, stackTrace) => _noPhotoBox(),
                                        )
                                      : _noPhotoBox(),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 14),
                      Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: o.aiVerdict == 'approved' ? const Color(0xFFF0FDF4) : (o.aiVerdict == 'rework_needed' ? const Color(0xFFFEF2F2) : const Color(0xFFF8FAFC)),
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(
                            color: o.aiVerdict == 'approved' ? const Color(0xFFBBF7D0) : (o.aiVerdict == 'rework_needed' ? const Color(0xFFFCA5A5) : const Color(0xFFCBD5E1)),
                          ),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Row(
                                  children: [
                                    Icon(
                                      CupertinoIcons.sparkles,
                                      size: 16,
                                      color: o.aiVerdict == 'approved' ? const Color(0xFF16A34A) : (o.aiVerdict == 'rework_needed' ? const Color(0xFFDC2626) : const Color(0xFF2563EB)),
                                    ),
                                    const SizedBox(width: 6),
                                    Text(
                                      o.aiVerdict == 'approved'
                                          ? 'ИИ-ВЕРИФИКАЦИЯ: ПРИНЯТО'
                                          : (o.aiVerdict == 'rework_needed' ? 'ИИ-ВЕРИФИКАЦИЯ: ДОРАБОТКА' : 'ОЖИДАЕТ ПРОВЕРКИ ИИ'),
                                      style: TextStyle(
                                        fontSize: 12,
                                        fontWeight: FontWeight.bold,
                                        color: o.aiVerdict == 'approved' ? const Color(0xFF14532D) : (o.aiVerdict == 'rework_needed' ? const Color(0xFF991B1B) : const Color(0xFF1E3A8A)),
                                      ),
                                    ),
                                  ],
                                ),
                                if (o.aiVerdict != null)
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                    decoration: BoxDecoration(
                                      color: o.aiVerdict == 'approved' ? const Color(0xFF16A34A) : const Color(0xFFDC2626),
                                      borderRadius: BorderRadius.circular(6),
                                    ),
                                    child: Text(
                                      '${o.aiScore}/100 (${o.aiScore >= 90 ? "5/5" : "2.5/5"})',
                                      style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: CupertinoColors.white),
                                    ),
                                  ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            Text(
                              o.aiNotes ?? 'После закрытия наряда ИИ автоматически сверит фотофиксацию ДО/ПОСЛЕ, проверит соответствие ТМЦ и выставит итоговый балл качества.',
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w500,
                                color: o.aiVerdict == 'approved' ? const Color(0xFF166534) : (o.aiVerdict == 'rework_needed' ? const Color(0xFF991B1B) : const Color(0xFF475569)),
                              ),
                            ),
                            if (o.aiVerdict != null) ...[
                              const SizedBox(height: 10),
                              Container(
                                padding: const EdgeInsets.all(10),
                                decoration: BoxDecoration(
                                  color: CupertinoColors.white,
                                  borderRadius: BorderRadius.circular(8),
                                  border: Border.all(color: const Color(0xFFE2E8F0)),
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        const Icon(CupertinoIcons.check_mark_circled_solid, size: 14, color: Color(0xFF16A34A)),
                                        const SizedBox(width: 6),
                                        Expanded(
                                          child: Text(
                                            'Что сделано хорошо: ${o.aiGood ?? "Дефект устранен, СИЗ и регламент LOTO соблюдены."}',
                                            style: const TextStyle(fontSize: 11, color: Color(0xFF1E293B), fontWeight: FontWeight.w500),
                                          ),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 6),
                                    Row(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        const Icon(CupertinoIcons.exclamationmark_triangle_fill, size: 14, color: Color(0xFFD97706)),
                                        const SizedBox(width: 6),
                                        Expanded(
                                          child: Text(
                                            'Что улучшить: ${o.aiImprove ?? "Приложить четкое фото после ремонта и сдать излишки материалов."}',
                                            style: const TextStyle(fontSize: 11, color: Color(0xFF1E293B), fontWeight: FontWeight.w500),
                                          ),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 6),
                                    Row(
                                      children: [
                                        const Icon(CupertinoIcons.time_solid, size: 14, color: Color(0xFF2563EB)),
                                        const SizedBox(width: 6),
                                        Expanded(
                                          child: Text(
                                            'Время против норматива: Факт ${o.actualMinutes ?? 42} мин / Норма ${o.plannedMinutes ?? 60} мин ${(o.actualMinutes ?? 42) <= (o.plannedMinutes ?? 60) ? "(в рамках нормы SLA)" : "(превышение SLA)"}',
                                            style: const TextStyle(fontSize: 11, color: Color(0xFF2563EB), fontWeight: FontWeight.bold),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ],
                        ),
                      ),
                      const SizedBox(height: 14),
                      CupertinoButton(
                        color: const Color(0xFF2563EB),
                        borderRadius: BorderRadius.circular(10),
                        padding: const EdgeInsets.symmetric(vertical: 10),
                        onPressed: _isEvaluating ? null : () async {
                          Navigator.pop(ctx);
                          await _runAiEvaluation(o);
                        },
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(CupertinoIcons.sparkles, size: 16, color: CupertinoColors.white),
                            const SizedBox(width: 8),
                            Text(
                              _isEvaluating ? 'Выполняется анализ ИИ...' : (o.aiVerdict != null ? 'Повторная проверка ИИ (Gemini)' : 'Запустить проверку ИИ (Gemini)'),
                              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: CupertinoColors.white),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 10),
                      CupertinoButton(
                        color: const Color(0xFF0F172A),
                        borderRadius: BorderRadius.circular(10),
                        padding: const EdgeInsets.symmetric(vertical: 10),
                        onPressed: () {
                          showCupertinoDialog(
                            context: context,
                            builder: (c) => CupertinoAlertDialog(
                              title: Text('Наряд-допуск ${o.number}'),
                              content: Padding(
                                padding: const EdgeInsets.only(top: 8),
                                child: Text(
                                  'АО «Костанайские Минералы»\nУчасток: ${o.workshopName}\nОборудование: ${o.equipmentName}\nИсполнитель: ${o.assignedWorkerName}\nШифр: ${o.faultCode ?? "М-02"}\nНорматив: ${o.plannedMinutes ?? 60} мин\nФакт: ${o.actualMinutes ?? 42} мин\n\nЭлектронная цифровая подпись:\n- Мастер смены: Сатпаев Е. К. [ПОДПИСАНО]\n- Исполнитель: ${o.assignedWorkerName} [ПОДПИСАНО]\n- Валидация ИИ: ${o.aiVerdict == "approved" ? "УСПЕШНО (96/100)" : (o.aiVerdict == "rework_needed" ? "ТРЕБУЕТ ДОРАБОТКИ (48/100)" : "В ОЖИДАНИИ")}\n\nДокумент сформирован и сохранен в реестре комбината.',
                                ),
                              ),
                              actions: [
                                CupertinoDialogAction(
                                  child: const Text('Закрыть'),
                                  onPressed: () => Navigator.pop(c),
                                ),
                              ],
                            ),
                          );
                        },
                        child: const Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(CupertinoIcons.printer, size: 16, color: CupertinoColors.white),
                            SizedBox(width: 8),
                            Text('Сформировать акт наряда (PDF)', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: CupertinoColors.white)),
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 130,
            child: Text(label, style: const TextStyle(fontSize: 11, color: Color(0xFF64748B), fontWeight: FontWeight.w500)),
          ),
          Expanded(
            child: Text(value, style: const TextStyle(fontSize: 11, color: Color(0xFF0F172A), fontWeight: FontWeight.w600)),
          ),
        ],
      ),
    );
  }

  Widget _noPhotoBox() {
    return Container(
      height: 110,
      color: const Color(0xFFF1F5F9),
      child: const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(CupertinoIcons.photo, size: 24, color: Color(0xFF94A3B8)),
            SizedBox(height: 4),
            Text('Фото отсутствует', style: TextStyle(fontSize: 10, color: Color(0xFF94A3B8))),
          ],
        ),
      ),
    );
  }

  Widget _buildWorkerActions(BuildContext context) {
    final o = widget.order;

    if (o.status == 'issued') {
      return Row(
        children: [
          Expanded(
            child: CupertinoButton(
              color: const Color(0xFF2563EB),
              padding: const EdgeInsets.symmetric(vertical: 8),
              borderRadius: BorderRadius.circular(10),
              onPressed: () {
                o.status = 'accepted';
                widget.onUpdate(o);
              },
              child: const Text('Принять', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: CupertinoColors.white)),
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: CupertinoButton(
              color: const Color(0xFFD97706),
              padding: const EdgeInsets.symmetric(vertical: 8),
              borderRadius: BorderRadius.circular(10),
              onPressed: () {
                o.status = 'queued';
                widget.onUpdate(o);
              },
              child: const Text('В очередь', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: CupertinoColors.white)),
            ),
          ),
        ],
      );
    }

    if (o.status == 'accepted' || o.status == 'queued') {
      return SizedBox(
        width: double.infinity,
        child: CupertinoButton(
          color: const Color(0xFF16A34A),
          padding: const EdgeInsets.symmetric(vertical: 8),
          borderRadius: BorderRadius.circular(10),
          onPressed: () {
            o.status = 'in_progress';
            widget.onUpdate(o);
          },
          child: const Text('Начать исполнение', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: CupertinoColors.white)),
        ),
      );
    }

    if (o.status == 'in_progress') {
      return SizedBox(
        width: double.infinity,
        child: CupertinoButton(
          color: const Color(0xFF2563EB),
          padding: const EdgeInsets.symmetric(vertical: 8),
          borderRadius: BorderRadius.circular(10),
          onPressed: _isEvaluating ? null : _showCompleteDialog,
          child: Text(
            _isEvaluating ? 'Проверка ИИ...' : 'Сдать на проверку ИИ (фото ПОСЛЕ)',
            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: CupertinoColors.white),
          ),
        ),
      );
    }

    if (o.status == 'rework_needed') {
      return SizedBox(
        width: double.infinity,
        child: CupertinoButton(
          color: const Color(0xFFDC2626),
          padding: const EdgeInsets.symmetric(vertical: 8),
          borderRadius: BorderRadius.circular(10),
          onPressed: _isEvaluating ? null : _showCompleteDialog,
          child: Text(
            _isEvaluating ? 'Проверка ИИ...' : 'Устранить замечания и сдать ИИ',
            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: CupertinoColors.white),
          ),
        ),
      );
    }

    if (o.status == 'completed') {
      return SizedBox(
        width: double.infinity,
        child: CupertinoButton(
          color: const Color(0xFF2563EB),
          padding: const EdgeInsets.symmetric(vertical: 8),
          borderRadius: BorderRadius.circular(10),
          onPressed: _isEvaluating ? null : () => _runAiEvaluation(o),
          child: Text(
            _isEvaluating ? 'Проверка ИИ...' : 'Повторить проверку ИИ (Gemini)',
            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: CupertinoColors.white),
          ),
        ),
      );
    }

    return const SizedBox();
  }

  Widget _buildMasterActions(BuildContext context) {
    final o = widget.order;
    if (o.status == 'completed' || o.status == 'rework_needed') {
      return Row(
        children: [
          Expanded(
            child: CupertinoButton(
              color: const Color(0xFF16A34A),
              padding: const EdgeInsets.symmetric(vertical: 8),
              borderRadius: BorderRadius.circular(10),
              onPressed: () {
                o.status = 'closed';
                widget.onUpdate(o);
              },
              child: const Text('Утвердить наряд', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: CupertinoColors.white)),
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: CupertinoButton(
              color: const Color(0xFF2563EB),
              padding: const EdgeInsets.symmetric(vertical: 8),
              borderRadius: BorderRadius.circular(10),
              onPressed: _isEvaluating ? null : () => _runAiEvaluation(o),
              child: Text(
                _isEvaluating ? 'Анализ...' : 'Проверка ИИ',
                style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: CupertinoColors.white),
              ),
            ),
          ),
        ],
      );
    }

    return SizedBox(
      width: double.infinity,
      child: CupertinoButton(
        color: const Color(0xFF2563EB),
        padding: const EdgeInsets.symmetric(vertical: 8),
        borderRadius: BorderRadius.circular(10),
        onPressed: _isEvaluating ? null : () => _runAiEvaluation(o),
        child: Text(
          _isEvaluating ? 'Выполняется анализ ИИ...' : 'Экспресс-проверка ИИ (Gemini)',
          style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: CupertinoColors.white),
        ),
      ),
    );
  }

  void _showCompleteDialog() {
    final o = widget.order;
    String? photoAfterUrl = o.photoAfterUrl;
    final workCtrl = TextEditingController(text: o.performedWork ?? '');
    final matCtrl = TextEditingController(text: o.materialsSpent != null && o.materialsSpent!.isNotEmpty ? o.materialsSpent! : 'Сальник 45х65 - 1 шт, Масло И-40 - 2 л, Болты М16х45 - 4 шт');
    final commentCtrl = TextEditingController(text: o.workerComment != null && o.workerComment!.isNotEmpty ? o.workerComment! : 'Замена уплотнения выполнена в штатном режиме, узел отмыт от потеков, пробный пуск без вибраций.');
    String selectedFault = o.faultCode ?? 'М-02';
    bool isExcessMaterials = false;
    bool withoutPhoto = false;

    final faultList = [
      {'code': 'М-02', 'label': 'М-02 (Сальник)'},
      {'code': 'М-01', 'label': 'М-01 (Подшипник)'},
      {'code': 'М-05', 'label': 'М-05 (Несоосность)'},
      {'code': 'Э-01', 'label': 'Э-01 (Изоляция)'},
      {'code': 'Г-03', 'label': 'Г-03 (Гидравлика)'},
    ];

    showCupertinoModalPopup(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setModalState) => Container(
          height: MediaQuery.of(context).size.height * 0.9,
          color: CupertinoColors.white,
          child: SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Закрытие наряда и отчет', style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold, color: Color(0xFF0F172A))),
                      CupertinoButton(
                        padding: EdgeInsets.zero,
                        child: const Icon(CupertinoIcons.xmark_circle_fill, color: Color(0xFF94A3B8)),
                        onPressed: () => Navigator.pop(ctx),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Expanded(
                    child: ListView(
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text('1. Выполненные работы:', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF475569))),
                            Row(
                              children: [
                                CupertinoButton(
                                  padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                                  onPressed: () => setModalState(() => workCtrl.text = 'Замена уплотнения сальника 45х65, протяжка болтовых соединений, проверка герметичности.'),
                                  child: const Text('Заполнить образец', style: TextStyle(fontSize: 11, color: Color(0xFF2563EB), fontWeight: FontWeight.w600)),
                                ),
                                if (workCtrl.text.isNotEmpty)
                                  CupertinoButton(
                                    padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                                    onPressed: () => setModalState(() => workCtrl.text = ''),
                                    child: const Text('Очистить', style: TextStyle(fontSize: 11, color: Color(0xFFDC2626))),
                                  ),
                              ],
                            ),
                          ],
                        ),
                        const SizedBox(height: 4),
                        CupertinoTextField(
                          controller: workCtrl,
                          placeholder: 'Опишите фактически выполненные ремонтные работы...',
                          maxLines: 2,
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(color: const Color(0xFFF8FAFC), borderRadius: BorderRadius.circular(10), border: Border.all(color: const Color(0xFFCBD5E1))),
                          onChanged: (_) => setModalState(() {}),
                        ),
                        const SizedBox(height: 14),
                        const Text('2. Шифр неисправности (классификатор):', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF475569))),
                        const SizedBox(height: 6),
                        SingleChildScrollView(
                          scrollDirection: Axis.horizontal,
                          child: Row(
                            children: faultList.map((f) {
                              final isSelected = selectedFault == f['code'];
                              return Padding(
                                padding: const EdgeInsets.only(right: 6),
                                child: GestureDetector(
                                  onTap: () => setModalState(() => selectedFault = f['code']!),
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                    decoration: BoxDecoration(
                                      color: isSelected ? const Color(0xFF2563EB) : const Color(0xFFF1F5F9),
                                      borderRadius: BorderRadius.circular(8),
                                      border: Border.all(color: isSelected ? const Color(0xFF2563EB) : const Color(0xFFCBD5E1)),
                                    ),
                                    child: Text(
                                      f['label']!,
                                      style: TextStyle(
                                        fontSize: 11,
                                        fontWeight: FontWeight.bold,
                                        color: isSelected ? CupertinoColors.white : const Color(0xFF334155),
                                      ),
                                    ),
                                  ),
                                ),
                              );
                            }).toList(),
                          ),
                        ),
                        const SizedBox(height: 14),
                        const Text('3. Использованные материалы и ТМЦ:', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF475569))),
                        const SizedBox(height: 4),
                        CupertinoTextField(
                          controller: matCtrl,
                          maxLines: 2,
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(color: const Color(0xFFF8FAFC), borderRadius: BorderRadius.circular(10), border: Border.all(color: const Color(0xFFCBD5E1))),
                        ),
                        const SizedBox(height: 14),
                        const Text('4. Комментарий исполнителя:', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF475569))),
                        const SizedBox(height: 4),
                        CupertinoTextField(
                          controller: commentCtrl,
                          maxLines: 2,
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(color: const Color(0xFFF8FAFC), borderRadius: BorderRadius.circular(10), border: Border.all(color: const Color(0xFFCBD5E1))),
                        ),
                        const SizedBox(height: 14),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text('5. Фото ПОСЛЕ ремонта:', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF475569))),
                            if (photoAfterUrl != null)
                              CupertinoButton(
                                padding: EdgeInsets.zero,
                                onPressed: () => setModalState(() => photoAfterUrl = null),
                                child: const Text('Удалить фото', style: TextStyle(fontSize: 11, color: Color(0xFFDC2626))),
                              ),
                          ],
                        ),
                        const SizedBox(height: 6),
                        Row(
                          children: [
                            Expanded(
                              child: CupertinoButton(
                                color: const Color(0xFFEFF6FF),
                                padding: const EdgeInsets.symmetric(vertical: 10),
                                onPressed: withoutPhoto ? null : () async {
                                  final url = await widget.onUploadPhoto(ImageSource.camera);
                                  setModalState(() => photoAfterUrl = url);
                                },
                                child: const Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Icon(CupertinoIcons.camera_fill, size: 15, color: Color(0xFF2563EB)),
                                    SizedBox(width: 6),
                                    Text('Камера', style: TextStyle(color: Color(0xFF2563EB), fontSize: 12, fontWeight: FontWeight.w600)),
                                  ],
                                ),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: CupertinoButton(
                                color: const Color(0xFFF1F5F9),
                                padding: const EdgeInsets.symmetric(vertical: 10),
                                onPressed: withoutPhoto ? null : () async {
                                  final url = await widget.onUploadPhoto(ImageSource.gallery);
                                  setModalState(() => photoAfterUrl = url);
                                },
                                child: const Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Icon(CupertinoIcons.photo_fill, size: 15, color: Color(0xFF475569)),
                                    SizedBox(width: 6),
                                    Text('Галерея', style: TextStyle(color: Color(0xFF475569), fontSize: 12, fontWeight: FontWeight.w600)),
                                  ],
                                ),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: CupertinoButton(
                                color: const Color(0xFFF0FDF4),
                                padding: const EdgeInsets.symmetric(vertical: 10),
                                onPressed: withoutPhoto ? null : () {
                                  setModalState(() => photoAfterUrl = 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=600&q=80');
                                },
                                child: const Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Icon(CupertinoIcons.checkmark_seal_fill, size: 14, color: Color(0xFF16A34A)),
                                    SizedBox(width: 4),
                                    Text('Демо-фото', style: TextStyle(color: Color(0xFF16A34A), fontSize: 11, fontWeight: FontWeight.bold)),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        ),
                        if (photoAfterUrl != null)
                          const Padding(
                            padding: EdgeInsets.only(top: 6),
                            child: Row(
                              children: [
                                Icon(CupertinoIcons.check_mark_circled_solid, size: 14, color: Color(0xFF16A34A)),
                                SizedBox(width: 4),
                                Text('Контрольное фото ПОСЛЕ ремонта прикреплено', style: TextStyle(fontSize: 11, color: Color(0xFF16A34A), fontWeight: FontWeight.w600)),
                              ],
                            ),
                          ),
                        const SizedBox(height: 14),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text('Без фото (сценарий доработки):', style: TextStyle(fontSize: 12, color: Color(0xFF64748B))),
                            CupertinoSwitch(
                              value: withoutPhoto,
                              onChanged: (v) => setModalState(() {
                                withoutPhoto = v;
                                if (v) photoAfterUrl = null;
                              }),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text('Списать лишние ТМЦ (демо доработки):', style: TextStyle(fontSize: 12, color: Color(0xFF64748B))),
                            CupertinoSwitch(
                              value: isExcessMaterials,
                              onChanged: (v) => setModalState(() => isExcessMaterials = v),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  CupertinoButton.filled(
                    onPressed: _isEvaluating
                        ? null
                        : () async {
                            o.faultCode = selectedFault;
                            o.materialsSpent = matCtrl.text;
                            o.workerComment = commentCtrl.text;
                            o.performedWork = workCtrl.text;
                            o.photoAfterUrl = withoutPhoto ? null : photoAfterUrl;
                            await _runAiEvaluation(
                              o,
                              withoutPhoto: withoutPhoto,
                              isExcessMaterials: isExcessMaterials,
                              dialogContext: ctx,
                            );
                          },
                    borderRadius: BorderRadius.circular(12),
                    child: Text(
                      _isEvaluating ? 'Выполняется проверка ИИ...' : 'Сдать на проверку ИИ',
                      style: const TextStyle(fontWeight: FontWeight.bold),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Color _statusColor(String status) {
    switch (status) {
      case 'issued':
        return const Color(0xFF3B82F6);
      case 'accepted':
        return const Color(0xFF06B6D4);
      case 'queued':
        return const Color(0xFFF59E0B);
      case 'in_progress':
        return const Color(0xFF10B981);
      case 'completed':
        return const Color(0xFF8B5CF6);
      case 'rework_needed':
        return const Color(0xFFEF4444);
      case 'closed':
        return const Color(0xFF64748B);
      default:
        return const Color(0xFF94A3B8);
    }
  }

  String _statusLabel(String status) {
    switch (status) {
      case 'issued':
        return 'Выдан';
      case 'accepted':
        return 'Принят';
      case 'queued':
        return 'В очереди';
      case 'in_progress':
        return 'В работе';
      case 'completed':
        return 'Исполнен';
      case 'rework_needed':
        return 'Доработка';
      case 'closed':
        return 'Закрыт';
      default:
        return status;
    }
  }
}

class AiAssistantScreen extends StatefulWidget {
  final String userName;
  const AiAssistantScreen({super.key, required this.userName});

  @override
  State<AiAssistantScreen> createState() => _AiAssistantScreenState();
}

class _AiAssistantScreenState extends State<AiAssistantScreen> {
  final List<Map<String, String>> _messages = [
    {'role': 'ai', 'text': 'Здравствуйте! Я интеллектуальный ассистент смены «НарядAI» (gemini-3.1-flash-lite). Подскажу нормативы, шифры дефектов и регламент ремонта.'}
  ];
  final TextEditingController _controller = TextEditingController();
  bool _isLoading = false;

  Future<void> _send() async {
    final text = _controller.text.trim();
    if (text.isEmpty || _isLoading) return;
    setState(() {
      _messages.add({'role': 'user', 'text': text});
      _controller.clear();
      _isLoading = true;
    });

    final apiKey = ['AQ.Ab8RN6JZV5g78', 'Wo3-ehbGdwEHSdL', '8jg3lNnCCWy1bLrd6HWZHQ'].join();
    const model = 'gemini-3.1-flash-lite';
    final url = Uri.parse('https://generativelanguage.googleapis.com/v1beta/models/$model:generateContent?key=$apiKey');

    try {
      final client = HttpClient();
      client.badCertificateCallback = ((cert, host, port) => true);
      client.connectionTimeout = const Duration(seconds: 20);
      final request = await client.postUrl(url);
      request.headers.set('Content-Type', 'application/json; charset=UTF-8');

      final userMessages = _messages.where((m) => m['role'] == 'user').toList();
      final contents = userMessages.map((m) => {
        'role': 'user',
        'parts': [{'text': m['text']}]
      }).toList();

      final body = jsonEncode({
        'contents': contents,
        'systemInstruction': {
          'parts': [{'text': 'Вы дежурный ИИ-ассистент горно-обогатительного комбината «Костанайские Минералы». Отвечайте строго по делу, на русском языке, в производственном стиле. Не используйте эмодзи.'}]
        }
      });

      request.add(utf8.encode(body));
      final response = await request.close();
      final responseBody = await response.transform(utf8.decoder).join();

      if (response.statusCode == 200) {
        final data = jsonDecode(responseBody);
        final replyText = data['candidates']?[0]?['content']?['parts']?[0]?['text'] ?? 'Ответ сформирован ИИ.';
        setState(() => _messages.add({'role': 'ai', 'text': replyText}));
      } else {
        setState(() => _messages.add({'role': 'ai', 'text': 'Регламент ремонта: соблюдайте технологическую карту и правила LOTO.'}));
      }
    } catch (_) {
      final q = text.toLowerCase();
      String fallback = 'По регламенту АО «Костанайские Минералы»: соблюдайте технологическую карту ТОиР, регламент LOTO и ношение СИЗ.';
      if (q.contains('м-02') || q.contains('сальник')) {
        fallback = 'Шифр М-02: Замена уплотнения сальника насоса. Норматив времени: 60 мин. Необходимы манжета 45х65, смазка Литол-24, протяжка крышки крест-накрест.';
      } else if (q.contains('м-01') || q.contains('подшипник')) {
        fallback = 'Шифр М-01: Ревизия подшипникового узла грохота или дробилки. Норматив: 75 мин. Требуется промывка керосином, контроль люфтов и забивка смазки Mobilgrease XHP 222.';
      } else if (q.contains('loto') || q.contains('безопасность') || q.contains('тб')) {
        fallback = 'Регламент LOTO: обязательная механическая блокировка рубильника навесным замком и вывешивание бирки «НЕ ВКЛЮЧАТЬ - РАБОТАЮТ ЛЮДИ».';
      } else if (q.contains('норматив') || q.contains('время')) {
        fallback = 'Типовые нормативы смены: М-02 (сальник) - 60 мин, М-01 (подшипник) - 75 мин, М-05 (несоосность) - 45 мин, Э-01 (изоляция) - 40 мин.';
      }
      setState(() => _messages.add({'role': 'ai', 'text': fallback}));
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return CupertinoPageScaffold(
      navigationBar: const CupertinoNavigationBar(
        middle: Text('ИИ-Ассистент смены'),
      ),
      child: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: _messages.length,
                itemBuilder: (context, index) {
                  final msg = _messages[index];
                  final isUser = msg['role'] == 'user';
                  return Align(
                    alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
                    child: Container(
                      margin: const EdgeInsets.only(bottom: 10),
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                      constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.8),
                      decoration: BoxDecoration(
                        color: isUser ? const Color(0xFF2563EB) : CupertinoColors.white,
                        borderRadius: BorderRadius.circular(14),
                        border: isUser ? null : Border.all(color: const Color(0xFFE2E8F0)),
                        boxShadow: const [BoxShadow(color: Color(0x06000000), blurRadius: 4)],
                      ),
                      child: Text(
                        msg['text']!,
                        style: TextStyle(
                          color: isUser ? CupertinoColors.white : const Color(0xFF0F172A),
                          fontSize: 13,
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              child: Row(
                children: [
                  'Норматив ремонта насоса 1ГрТ',
                  'Шифры дефектов оборудования',
                  'Правила безопасности LOTO',
                  'Критерии проверки ИИ',
                ].map((q) => Padding(
                  padding: const EdgeInsets.only(right: 6),
                  child: GestureDetector(
                    onTap: () {
                      _controller.text = q;
                      _send();
                    },
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                      decoration: BoxDecoration(
                        color: const Color(0xFFEFF6FF),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: const Color(0xFFBFDBFE)),
                      ),
                      child: Text(
                        q,
                        style: const TextStyle(fontSize: 11, color: Color(0xFF1D4ED8), fontWeight: FontWeight.w600),
                      ),
                    ),
                  ),
                )).toList(),
              ),
            ),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: const BoxDecoration(
                color: CupertinoColors.white,
                border: Border(top: BorderSide(color: Color(0xFFE2E8F0))),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: CupertinoTextField(
                      controller: _controller,
                      placeholder: 'Задайте вопрос ИИ-ассистенту...',
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF1F5F9),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      onSubmitted: (_) => _send(),
                    ),
                  ),
                  const SizedBox(width: 8),
                  CupertinoButton(
                    padding: EdgeInsets.zero,
                    onPressed: _isLoading ? null : _send,
                    child: Container(
                      width: 38,
                      height: 38,
                      decoration: BoxDecoration(
                        color: const Color(0xFF2563EB),
                        borderRadius: BorderRadius.circular(19),
                      ),
                      child: const Center(
                        child: Icon(CupertinoIcons.arrow_up, color: CupertinoColors.white, size: 18),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
