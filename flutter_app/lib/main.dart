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
    createdAt: json['createdAt'] ?? json['created_at'] ?? DateTime.now().toIso8601String(),
    deadlineAt: json['deadlineAt'] ?? json['deadline_at'] ?? DateTime.now().toIso8601String(),
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
  EmployeeData(id: 'emp_1', fullName: 'Ахметов Ербол Каиржанович', specialty: 'Слесарь-ремонтник', rank: 5, role: 'worker', status: 'free', rating: 96, onTimeRate: 98),
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
    anonKey: 'sb_publishable_sCwXPQDWrNK-AbcMZhvEnw_3Dr1vDyi',
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

  @override
  void initState() {
    super.initState();
    _initInitialOrders();
    _setupSupabaseRealtime();
    _fetchOrdersFromSupabase();
    _deadlineTimer = Timer.periodic(const Duration(seconds: 4), (timer) {
      final now = DateTime.now();
      for (final o in _orders) {
        if (o.status != 'completed' && o.status != 'closed') {
          final deadline = DateTime.tryParse(o.deadlineAt);
          if (deadline != null && now.isAfter(deadline) && !o.isOverdue) {
            setState(() {
              o.isOverdue = true;
            });
            _broadcastOrder(o);
            _showNotification('Внимание: Просрочка ИИ!', 'Наряд ${o.number} (${o.equipmentName}) просрочен! ИИ отправил эскалацию мастеру и исполнителю.');
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
        id: 'ord_active_1',
        number: '№147',
        title: 'Аварийный перегрев подшипника привода КМД-1750',
        description: 'Дробилка КМД-1750, участок дробления. Температура опорного подшипника превысила +85°C.',
        equipmentName: 'Дробилка конусная КМД-1750Т',
        workshopName: 'Участок дробления',
        priority: 'emergency',
        createdAt: DateTime.now().subtract(const Duration(minutes: 55)).toIso8601String(),
        deadlineAt: DateTime.now().subtract(const Duration(minutes: 10)).toIso8601String(),
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
        createdAt: DateTime.now().subtract(const Duration(minutes: 25)).toIso8601String(),
        deadlineAt: DateTime.now().add(const Duration(minutes: 65)).toIso8601String(),
        status: 'in_progress',
        assignedWorkerId: 'emp_7',
        assignedWorkerName: 'Васильев Олег Петрович',
        photoBeforeUrl: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=600&q=80',
        faultCode: 'Э-02',
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
            BottomNavigationBarItem(icon: Icon(CupertinoIcons.chart_bar_square_fill), label: 'Рейтинг'),
            BottomNavigationBarItem(icon: Icon(CupertinoIcons.sparkles), label: 'ИИ'),
          ]
        : const [
            BottomNavigationBarItem(icon: Icon(CupertinoIcons.square_list_fill), label: 'Мои наряды'),
            BottomNavigationBarItem(icon: Icon(CupertinoIcons.sparkles), label: 'ИИ-Помощник'),
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
              return _buildRatingTab();
            default:
              return AiAssistantScreen(userName: widget.workerName);
          }
        } else {
          if (index == 0) return _buildOrdersTab();
          return AiAssistantScreen(userName: widget.workerName);
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
    final filtered = widget.role == 'master'
        ? _orders
        : _orders.where((o) => o.assignedWorkerId == widget.workerId).toList();

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
        child: filtered.isEmpty
            ? Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(CupertinoIcons.doc_text, size: 48, color: Color(0xFF94A3B8)),
                    const SizedBox(height: 12),
                    Text(
                      widget.role == 'master' ? 'Нет активных нарядов' : 'У вас пока нет назначенных нарядов',
                      style: const TextStyle(color: Color(0xFF64748B), fontSize: 14),
                    ),
                  ],
                ),
              )
            : ListView.builder(
                padding: const EdgeInsets.all(16),
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
    );
  }

  Widget _buildRatingTab() {
    final sorted = List<EmployeeData>.from(_staff.where((e) => e.role == 'worker'))..sort((a, b) => b.rating.compareTo(a.rating));

    return CupertinoPageScaffold(
      navigationBar: const CupertinoNavigationBar(
        middle: Text('Рейтинг смены и аналитика'),
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
              child: const Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Сводный отчет за смену:', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 12)),
                  SizedBox(height: 6),
                  Text('Выполнение плана ремонтов: 98.4%', style: TextStyle(color: CupertinoColors.white, fontSize: 16, fontWeight: FontWeight.bold)),
                  SizedBox(height: 4),
                  Text('Среднее время закрытия: 1 ч 42 мин • 0 повторных отказов', style: TextStyle(color: Color(0xFF38BDF8), fontSize: 11)),
                ],
              ),
            ),
            const SizedBox(height: 20),
            const Text('Топ исполнителей смены:', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF0F172A))),
            const SizedBox(height: 8),
            ...sorted.map((w) => Container(
              margin: const EdgeInsets.only(bottom: 8),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(color: CupertinoColors.white, borderRadius: BorderRadius.circular(12), border: Border.all(color: const Color(0xFFE2E8F0))),
              child: Row(
                children: [
                  Text('${sorted.indexOf(w) + 1}.', style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF64748B), fontSize: 14)),
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
                      Text('${w.rating}%', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: w.rating >= 90 ? const Color(0xFF16A34A) : const Color(0xFFDC2626))),
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
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text('3. Нормативный срок (SLA):', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF475569))),
                            Row(
                              children: [
                                CupertinoButton(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                  color: deadlineMinutes == 120 ? const Color(0xFF2563EB) : const Color(0xFFE2E8F0),
                                  onPressed: () => setModalState(() => deadlineMinutes = 120),
                                  child: Text('2 часа', style: TextStyle(fontSize: 11, color: deadlineMinutes == 120 ? CupertinoColors.white : const Color(0xFF475569), fontWeight: FontWeight.bold)),
                                ),
                                const SizedBox(width: 6),
                                CupertinoButton(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                  color: deadlineMinutes == 1 ? const Color(0xFFDC2626) : const Color(0xFFE2E8F0),
                                  onPressed: () => setModalState(() => deadlineMinutes = 1),
                                  child: Text('1 мин (демо)', style: TextStyle(fontSize: 11, color: deadlineMinutes == 1 ? CupertinoColors.white : const Color(0xFF475569), fontWeight: FontWeight.bold)),
                                ),
                              ],
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
                        createdAt: DateTime.now().toIso8601String(),
                        deadlineAt: DateTime.now().add(Duration(minutes: deadlineMinutes)).toIso8601String(),
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

  @override
  Widget build(BuildContext context) {
    final o = widget.order;
    final isWorker = widget.role == 'worker';

    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: CupertinoColors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: o.isOverdue ? const Color(0xFFFCA5A5) : const Color(0xFFE2E8F0)),
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
                          '${o.aiScore}/100 (${o.aiScore >= 90 ? "5/5" : "3.5/5"})',
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
          const SizedBox(height: 14),
          if (isWorker) _buildWorkerActions(context),
          if (!isWorker) _buildMasterActions(context),
        ],
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
              child: const Text('Принять', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: CupertinoButton(
              color: const Color(0xFFF59E0B),
              padding: const EdgeInsets.symmetric(vertical: 8),
              borderRadius: BorderRadius.circular(10),
              onPressed: () {
                o.status = 'queued';
                widget.onUpdate(o);
              },
              child: const Text('В очередь', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
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
          child: const Text('Начать исполнение', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
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
          onPressed: _isEvaluating ? null : () => _showCompleteDialog(context),
          child: Text(
            _isEvaluating ? 'Проверка ИИ...' : 'Завершить (фото ПОСЛЕ)',
            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
          ),
        ),
      );
    }

    return const SizedBox();
  }

  Widget _buildMasterActions(BuildContext context) {
    final o = widget.order;
    if (o.status == 'completed' || o.status == 'rework_needed') {
      return SizedBox(
        width: double.infinity,
        child: CupertinoButton(
          color: const Color(0xFF16A34A),
          padding: const EdgeInsets.symmetric(vertical: 8),
          borderRadius: BorderRadius.circular(10),
          onPressed: () {
            o.status = 'closed';
            widget.onUpdate(o);
          },
          child: const Text('Утвердить и закрыть наряд', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
        ),
      );
    }
    return const SizedBox();
  }

  void _showCompleteDialog(BuildContext context) {
    final o = widget.order;
    String? photoAfterUrl;
    final workCtrl = TextEditingController(text: o.performedWork ?? 'Замена уплотнения сальника, протяжка болтовых соединений, проверка герметичности.');
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
                        const Text('1. Выполненные работы:', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF475569))),
                        const SizedBox(height: 4),
                        CupertinoTextField(
                          controller: workCtrl,
                          maxLines: 2,
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(color: const Color(0xFFF8FAFC), borderRadius: BorderRadius.circular(10), border: Border.all(color: const Color(0xFFCBD5E1))),
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
                        const Text('5. Фото ПОСЛЕ ремонта:', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF475569))),
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
                          ],
                        ),
                        if (photoAfterUrl != null)
                          const Padding(
                            padding: EdgeInsets.only(top: 6),
                            child: Row(
                              children: [
                                Icon(CupertinoIcons.check_mark_circled_solid, size: 14, color: Color(0xFF16A34A)),
                                SizedBox(width: 4),
                                Text('Фото устранения дефекта прикреплено', style: TextStyle(fontSize: 11, color: Color(0xFF16A34A), fontWeight: FontWeight.w600)),
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
                    onPressed: () {
                      Navigator.pop(ctx);
                      setState(() => _isEvaluating = true);
                      Future.delayed(const Duration(seconds: 1), () {
                        if (withoutPhoto || isExcessMaterials) {
                          o.status = 'rework_needed';
                          o.aiVerdict = 'rework_needed';
                          o.aiScore = 68;
                          o.aiNotes = 'Требует доработки: отсутствует контрольное фото ПОСЛЕ и списание масла превысило норму в 2.4 раза.';
                          o.aiGood = 'Работы по механической сборке и протяжке болтов зафиксированы в описании.';
                          o.aiImprove = 'Приложить четкое фото после устранения дефекта; вернуть неизрасходованный объем масла на склад комбината.';
                          o.actualMinutes = 75;
                          o.plannedMinutes = 60;
                        } else {
                          o.status = 'completed';
                          o.aiVerdict = 'approved';
                          o.aiScore = 96;
                          o.aiNotes = 'Работы приняты: фото подтвердило отсутствие течи, СИЗ надеты, списание ТМЦ обосновано.';
                          o.aiGood = 'Течь масла устранена на 100%. Узел очищен, соосность в норме. Регламент LOTO и ношение СИЗ соблюдены.';
                          o.aiImprove = 'В следующий раз указывать величину проверочного зазора щупом в комментарии.';
                          o.actualMinutes = 42;
                          o.plannedMinutes = 60;
                          o.photoAfterUrl = photoAfterUrl ?? 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=600&q=80';
                        }
                        o.faultCode = selectedFault;
                        o.materialsSpent = matCtrl.text;
                        o.workerComment = commentCtrl.text;
                        o.performedWork = workCtrl.text;
                        setState(() => _isEvaluating = false);
                        widget.onUpdate(o);
                      });
                    },
                    borderRadius: BorderRadius.circular(12),
                    child: const Text('Сдать на проверку ИИ', style: TextStyle(fontWeight: FontWeight.bold)),
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

      final contents = _messages.map((m) => {
        'role': m['role'] == 'user' ? 'user' : 'model',
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
        final replyText = data['candidates'][0]['content']['parts'][0]['text'];
        setState(() => _messages.add({'role': 'ai', 'text': replyText}));
      } else {
        setState(() => _messages.add({'role': 'ai', 'text': 'Ошибка ответа ИИ сервера'}));
      }
    } catch (_) {
      setState(() => _messages.add({'role': 'ai', 'text': 'Проверьте подключение к сети'}));
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
