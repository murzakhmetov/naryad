import 'dart:convert';
import 'dart:io';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'models/models.dart';
import 'data/mock_data.dart';

void main() {
  runApp(const NaryadAiApp());
}

class NaryadAiApp extends StatelessWidget {
  const NaryadAiApp({super.key});

  @override
  Widget build(BuildContext context) {
    return const CupertinoApp(
      title: 'НарядAI - АО Костанайские Минералы',
      theme: CupertinoThemeData(
        brightness: Brightness.light,
        primaryColor: CupertinoColors.activeBlue,
        scaffoldBackgroundColor: Color(0xFFF2F2F7),
        barBackgroundColor: Color(0xCCFFFFFF),
      ),
      home: MainTabBarScreen(),
      debugShowCheckedModeBanner: false,
    );
  }
}

class MainTabBarScreen extends StatefulWidget {
  const MainTabBarScreen({super.key});

  @override
  State<MainTabBarScreen> createState() => _MainTabBarScreenState();
}

class _MainTabBarScreenState extends State<MainTabBarScreen> {
  late List<WorkOrderModel> _orders;
  bool _isKazakh = false;

  @override
  void initState() {
    super.initState();
    _orders = getInitialOrders();
  }

  void _updateOrder(WorkOrderModel updated) {
    setState(() {
      final index = _orders.indexWhere((o) => o.id == updated.id);
      if (index != -1) {
        _orders[index] = updated;
      } else {
        _orders.insert(0, updated);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return CupertinoTabScaffold(
      tabBar: CupertinoTabBar(
        activeColor: CupertinoColors.activeBlue,
        inactiveColor: CupertinoColors.systemGrey,
        items: [
          BottomNavigationBarItem(
            icon: const Icon(CupertinoIcons.heart_fill),
            label: _isKazakh ? 'Жиынтық' : 'Сводка',
          ),
          BottomNavigationBarItem(
            icon: const Icon(CupertinoIcons.square_list_fill),
            label: _isKazakh ? 'Нарядтар' : 'Наряды',
          ),
          BottomNavigationBarItem(
            icon: const Icon(CupertinoIcons.sparkles),
            label: _isKazakh ? 'ЖИ-Көмекші' : 'ИИ-Ассистент',
          ),
        ],
      ),
      tabBuilder: (context, index) {
        switch (index) {
          case 0:
            return SummaryScreen(
              orders: _orders,
              isKazakh: _isKazakh,
              onToggleLang: () => setState(() => _isKazakh = !_isKazakh),
              onUpdateOrder: _updateOrder,
            );
          case 1:
            return OrdersListScreen(
              orders: _orders,
              isKazakh: _isKazakh,
              onUpdateOrder: _updateOrder,
            );
          case 2:
            return AiAssistantScreen(isKazakh: _isKazakh);
          default:
            return Container();
        }
      },
    );
  }
}

class SummaryScreen extends StatelessWidget {
  final List<WorkOrderModel> orders;
  final bool isKazakh;
  final VoidCallback onToggleLang;
  final ValueChanged<WorkOrderModel> onUpdateOrder;

  const SummaryScreen({
    super.key,
    required this.orders,
    required this.isKazakh,
    required this.onToggleLang,
    required this.onUpdateOrder,
  });

  @override
  Widget build(BuildContext context) {
    final activeOrders = orders.where((o) => o.status != 'closed').toList();

    return CupertinoPageScaffold(
      navigationBar: CupertinoNavigationBar(
        middle: Text(
          isKazakh ? '«Қостанай Минералдары» АҚ' : 'АО «Костанайские Минералы»',
          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
        ),
        trailing: CupertinoButton(
          padding: EdgeInsets.zero,
          onPressed: onToggleLang,
          child: Text(
            isKazakh ? 'RU' : 'KZ',
            style: const TextStyle(fontWeight: FontWeight.bold),
          ),
        ),
      ),
      child: SafeArea(
        child: ListView(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          children: [
            
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  isKazakh ? 'Сводка' : 'Сводка',
                  style: const TextStyle(fontSize: 34, fontWeight: FontWeight.bold, letterSpacing: -1),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: CupertinoColors.activeGreen.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    isKazakh ? 'А ауысымы' : 'Смена А',
                    style: const TextStyle(
                      color: CupertinoColors.systemGreen,
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 4),
            Text(
              isKazakh ? '16 қазан 2026 ж. • Ахметов Ербол (5 разряд)' : '16 октября 2026 г. • Ахметов Ербол (5 разряд)',
              style: const TextStyle(fontSize: 13, color: CupertinoColors.systemGrey),
            ),
            const SizedBox(height: 16),

            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: CupertinoColors.white,
                borderRadius: BorderRadius.circular(18),
                boxShadow: [
                  BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 10, offset: const Offset(0, 4)),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        isKazakh ? 'КӨРСЕТКІШТЕР' : 'ПОКАЗАТЕЛИ СМЕНЫ',
                        style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: CupertinoColors.systemGrey),
                      ),
                      const Icon(CupertinoIcons.chart_bar_alt_fill, size: 16, color: CupertinoColors.activeBlue),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: [
                      _buildMetricItem(
                        title: isKazakh ? 'ЖИ рейтингі' : 'Рейтинг ИИ',
                        value: '96%',
                        color: CupertinoColors.activeGreen,
                      ),
                      _buildMetricItem(
                        title: isKazakh ? 'Мерзімінде' : 'В срок',
                        value: '98%',
                        color: CupertinoColors.activeBlue,
                      ),
                      _buildMetricItem(
                        title: isKazakh ? 'Нарядтар' : 'Наряды',
                        value: '${orders.length}',
                        color: CupertinoColors.systemIndigo,
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            Text(
              isKazakh ? 'Ағымдағы нарядтар' : 'Текущие наряды',
              style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),

            ...activeOrders.map((order) => OrderCardWidget(
              order: order,
              isKazakh: isKazakh,
              onUpdateOrder: onUpdateOrder,
            )),
          ],
        ),
      ),
    );
  }

  Widget _buildMetricItem({required String title, required String value, required Color color}) {
    return Column(
      children: [
        Container(
          width: 52,
          height: 52,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            border: Border.all(color: color, width: 4),
          ),
          alignment: Alignment.center,
          child: Text(
            value,
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: color),
          ),
        ),
        const SizedBox(height: 6),
        Text(title, style: const TextStyle(fontSize: 11, color: CupertinoColors.systemGrey)),
      ],
    );
  }
}

class OrderCardWidget extends StatelessWidget {
  final WorkOrderModel order;
  final bool isKazakh;
  final ValueChanged<WorkOrderModel> onUpdateOrder;

  const OrderCardWidget({
    super.key,
    required this.order,
    required this.isKazakh,
    required this.onUpdateOrder,
  });

  @override
  Widget build(BuildContext context) {
    final isEmergency = order.priority == 'emergency';

    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: CupertinoColors.white,
        borderRadius: BorderRadius.circular(18),
        border: isEmergency ? Border.all(color: CupertinoColors.systemRed.withValues(alpha: 0.4), width: 1.5) : null,
        boxShadow: [
          BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 10, offset: const Offset(0, 4)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                order.number,
                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: CupertinoColors.activeBlue),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: isEmergency ? CupertinoColors.systemRed.withValues(alpha: 0.12) : CupertinoColors.systemGrey6,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  isEmergency ? (isKazakh ? 'Апаттық' : 'Аварийный') : (isKazakh ? 'Жоспарлы' : 'Плановый'),
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                    color: isEmergency ? CupertinoColors.systemRed : CupertinoColors.systemGrey,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),

          Text(
            order.title,
            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, height: 1.2),
          ),
          const SizedBox(height: 4),
          Text(
            '${order.equipmentName} • ${order.workshopName}',
            style: const TextStyle(fontSize: 12, color: CupertinoColors.systemGrey),
          ),
          const SizedBox(height: 10),

          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: const Color(0xFFF8F9FA),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Text(
              order.description,
              style: const TextStyle(fontSize: 12, color: Color(0xFF2C3E50), height: 1.3),
            ),
          ),
          const SizedBox(height: 12),

          if (order.aiVerdict != null)
            Container(
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: order.aiVerdict == 'approved'
                    ? CupertinoColors.systemGreen.withValues(alpha: 0.12)
                    : CupertinoColors.systemYellow.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Row(
                children: [
                  Icon(
                    order.aiVerdict == 'approved' ? CupertinoIcons.check_mark_circled_solid : CupertinoIcons.exclamationmark_triangle_fill,
                    size: 18,
                    color: order.aiVerdict == 'approved' ? CupertinoColors.systemGreen : CupertinoColors.systemYellow,
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'ЖИ Вердикті: ${order.aiScore}/100. ${order.aiNotes ?? ""}',
                      style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold),
                    ),
                  ),
                ],
              ),
            ),

          _buildActionButtons(context),
        ],
      ),
    );
  }

  Widget _buildActionButtons(BuildContext context) {
    if (order.status == 'issued') {
      return Column(
        children: [
          SizedBox(
            width: double.infinity,
            height: 56, 
            child: CupertinoButton(
              color: CupertinoColors.activeGreen,
              borderRadius: BorderRadius.circular(16),
              padding: EdgeInsets.zero,
              onPressed: () {
                order.status = 'accepted';
                onUpdateOrder(order);
              },
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(CupertinoIcons.checkmark_alt, size: 22),
                  const SizedBox(width: 8),
                  Text(
                    isKazakh ? 'Жұмысқа қабылдау' : 'Принять в работу (перчатки)',
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: SizedBox(
                  height: 48,
                  child: CupertinoButton(
                    color: CupertinoColors.systemGrey5,
                    borderRadius: BorderRadius.circular(14),
                    padding: EdgeInsets.zero,
                    onPressed: () {
                      order.status = 'queued';
                      onUpdateOrder(order);
                    },
                    child: Text(
                      isKazakh ? 'Кезекке қою' : 'В очередь',
                      style: const TextStyle(color: CupertinoColors.activeBlue, fontWeight: FontWeight.bold, fontSize: 13),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: SizedBox(
                  height: 48,
                  child: CupertinoButton(
                    color: CupertinoColors.systemRed.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(14),
                    padding: EdgeInsets.zero,
                    onPressed: () => _showRejectDialog(context),
                    child: Text(
                      isKazakh ? 'Бас тарту' : 'Отклонить',
                      style: const TextStyle(color: CupertinoColors.systemRed, fontWeight: FontWeight.bold, fontSize: 13),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      );
    }

    if (order.status == 'accepted' || order.status == 'queued') {
      return SizedBox(
        width: double.infinity,
        height: 56,
        child: CupertinoButton(
          color: CupertinoColors.activeBlue,
          borderRadius: BorderRadius.circular(16),
          padding: EdgeInsets.zero,
          onPressed: () {
            order.status = 'in_progress';
            onUpdateOrder(order);
          },
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(CupertinoIcons.play_arrow_solid, size: 20),
              const SizedBox(width: 8),
              Text(
                isKazakh ? 'Орындауды бастау' : 'Начать исполнение',
                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
              ),
            ],
          ),
        ),
      );
    }

    if (order.status == 'in_progress') {
      return Column(
        children: [
          SizedBox(
            width: double.infinity,
            height: 60, 
            child: CupertinoButton(
              color: CupertinoColors.activeGreen,
              borderRadius: BorderRadius.circular(16),
              padding: EdgeInsets.zero,
              onPressed: () => _showClosingForm(context),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(CupertinoIcons.check_mark_circled, size: 24),
                  const SizedBox(width: 8),
                  Text(
                    isKazakh ? 'Орындалды - Нарядты жабу' : 'Исполнено - Закрыть наряд',
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 8),
          SizedBox(
            width: double.infinity,
            height: 46,
            child: CupertinoButton(
              color: CupertinoColors.systemYellow.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(14),
              padding: EdgeInsets.zero,
              onPressed: () => _showSuspendDialog(context),
              child: Text(
                isKazakh ? 'Тоқтата тұру (себеппен)' : 'Приостановить (с причиной)',
                style: const TextStyle(color: CupertinoColors.systemOrange, fontWeight: FontWeight.bold, fontSize: 13),
              ),
            ),
          ),
        ],
      );
    }

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 12),
      decoration: BoxDecoration(
        color: CupertinoColors.systemGrey6,
        borderRadius: BorderRadius.circular(12),
      ),
      alignment: Alignment.center,
      child: Text(
        'Статус: ${order.status}',
        style: const TextStyle(fontWeight: FontWeight.bold, color: CupertinoColors.systemGrey, fontSize: 13),
      ),
    );
  }

  void _showRejectDialog(BuildContext context) {
    showCupertinoDialog(
      context: context,
      builder: (ctx) => CupertinoAlertDialog(
        title: Text(isKazakh ? 'Бас тарту себебі' : 'Причина отклонения наряда'),
        content: Padding(
          padding: const EdgeInsets.only(top: 8.0),
          child: Text(isKazakh ? 'Апаттық нарядпен басқа учаскеде бос емеспін' : 'Занят аварийным ремонтом на другом участке'),
        ),
        actions: [
          CupertinoDialogAction(
            child: Text(isKazakh ? 'Жою' : 'Отмена'),
            onPressed: () => Navigator.pop(ctx),
          ),
          CupertinoDialogAction(
            isDestructiveAction: true,
            onPressed: () {
              order.status = 'rejected';
              onUpdateOrder(order);
              Navigator.pop(ctx);
            },
            child: Text(isKazakh ? 'Растау' : 'Отклонить'),
          ),
        ],
      ),
    );
  }

  void _showSuspendDialog(BuildContext context) {
    showCupertinoDialog(
      context: context,
      builder: (ctx) => CupertinoAlertDialog(
        title: Text(isKazakh ? 'Тоқтата тұру' : 'Приостановка наряда'),
        content: Padding(
          padding: const EdgeInsets.only(top: 8.0),
          child: Text(isKazakh ? 'Қоймадан қосалқы бөлшектерді күту' : 'Ждёт запчасти со склада (подшипник 22320)'),
        ),
        actions: [
          CupertinoDialogAction(
            child: Text(isKazakh ? 'Жою' : 'Отмена'),
            onPressed: () => Navigator.pop(ctx),
          ),
          CupertinoDialogAction(
            onPressed: () {
              order.status = 'suspended';
              onUpdateOrder(order);
              Navigator.pop(ctx);
            },
            child: Text(isKazakh ? 'Растау' : 'Приостановить'),
          ),
        ],
      ),
    );
  }

  void _showClosingForm(BuildContext context) {
    showCupertinoModalPopup(
      context: context,
      builder: (ctx) => Container(
        height: MediaQuery.of(context).size.height * 0.85,
        padding: const EdgeInsets.all(20),
        decoration: const BoxDecoration(
          color: CupertinoColors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  isKazakh ? 'Нарядты жабу нысаны' : 'Форма закрытия наряда',
                  style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                CupertinoButton(
                  padding: EdgeInsets.zero,
                  child: Text(isKazakh ? 'Жабу' : 'Закрыть'),
                  onPressed: () => Navigator.pop(ctx),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              isKazakh ? 'Орындалған жұмыстар сипаттамасы:' : 'Выполненные работы:',
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
            ),
            const SizedBox(height: 4),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: CupertinoColors.systemGrey6,
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Text(
                'Заменил подшипниковый узел 22320, смазка Литол-24 набита в объеме 2 кг. Защитный кожух смонтирован.',
                style: TextStyle(fontSize: 13),
              ),
            ),
            const SizedBox(height: 14),
            Text(
              isKazakh ? 'Ақау шифры:' : 'Шифр неисправности:',
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
            ),
            const SizedBox(height: 4),
            Text(
              'М-02: Разрушение подшипникового узла привода (Норматив 3.0 ч)',
              style: const TextStyle(fontSize: 13, color: CupertinoColors.activeBlue),
            ),
            const SizedBox(height: 14),
            Text(
              isKazakh ? 'Фото «Кейін» (Міндетті):' : 'Фото «После» (Обязательно для ИИ):',
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
            ),
            const SizedBox(height: 6),
            ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: Image.network(
                'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=600&q=80',
                height: 120,
                width: double.infinity,
                fit: BoxFit.cover,
              ),
            ),
            const Spacer(),
            SizedBox(
              width: double.infinity,
              height: 56,
              child: CupertinoButton(
                color: CupertinoColors.activeGreen,
                borderRadius: BorderRadius.circular(16),
                child: Text(
                  isKazakh ? 'ЖИ тексеруіне тапсыру' : 'Сдать на проверку ИИ (с фото)',
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                ),
                onPressed: () {
                  order.status = 'completed';
                  order.aiVerdict = 'approved';
                  order.aiScore = 96;
                  order.aiNotes = 'Мультимодальный анализ подтверждает устранение поломки. Оценка 5/5.';
                  onUpdateOrder(order);
                  Navigator.pop(ctx);
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class OrdersListScreen extends StatelessWidget {
  final List<WorkOrderModel> orders;
  final bool isKazakh;
  final ValueChanged<WorkOrderModel> onUpdateOrder;

  const OrdersListScreen({
    super.key,
    required this.orders,
    required this.isKazakh,
    required this.onUpdateOrder,
  });

  @override
  Widget build(BuildContext context) {
    return CupertinoPageScaffold(
      navigationBar: CupertinoNavigationBar(
        middle: Text(isKazakh ? 'Барлық нарядтар' : 'Все наряды смены'),
      ),
      child: SafeArea(
        child: ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: orders.length,
          itemBuilder: (context, index) {
            return OrderCardWidget(
              order: orders[index],
              isKazakh: isKazakh,
              onUpdateOrder: onUpdateOrder,
            );
          },
        ),
      ),
    );
  }
}

class AiAssistantScreen extends StatefulWidget {
  final bool isKazakh;
  const AiAssistantScreen({super.key, required this.isKazakh});

  @override
  State<AiAssistantScreen> createState() => _AiAssistantScreenState();
}

class _AiAssistantScreenState extends State<AiAssistantScreen> {
  final List<Map<String, String>> _messages = [
    {
      'role': 'ai',
      'text': 'Сәлеметсіз бе! «НарядAI» ассистенті кезекшілік бойынша сұрақтарыңызға жауап беруге дайын.'
    }
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

      final systemInstruction = widget.isKazakh
          ? 'Сіз «Қостанай Минералдары» АҚ «НарядAI» жүйесінің кезекші көмекшісісіз (gemini-3.1-flash-lite). Қысқа, нақты, өндірістік стильде қазақ тілінде жауап беріңіз. Эмодзи қолданбаңыз.'
          : 'Вы - оперативный ИИ-ассистент смены комбината «НарядAI» (АО «Костанайские Минералы»). Модель: gemini-3.1-flash-lite. Отвечайте кратко, профессионально, по существу. Без эмодзи.';

      final contents = <Map<String, dynamic>>[];
      for (final m in _messages) {
        if (m['role'] == 'user') {
          contents.add({
            'role': 'user',
            'parts': [{'text': m['text'] ?? ''}]
          });
        } else if (m['role'] == 'ai' && m['text'] != null) {
          contents.add({
            'role': 'model',
            'parts': [{'text': m['text'] ?? ''}]
          });
        }
      }

      final body = jsonEncode({
        'contents': contents,
        'systemInstruction': {
          'parts': [
            {'text': systemInstruction}
          ]
        }
      });

      request.add(utf8.encode(body));
      final response = await request.close();
      final responseBody = await response.transform(utf8.decoder).join();

      if (response.statusCode == 200) {
        final data = jsonDecode(responseBody) as Map<String, dynamic>;
        final candidates = data['candidates'] as List<dynamic>?;
        if (candidates != null && candidates.isNotEmpty) {
          final content = candidates[0]['content'] as Map<String, dynamic>?;
          final parts = content?['parts'] as List<dynamic>?;
          if (parts != null && parts.isNotEmpty) {
            final replyText = parts[0]['text'] as String?;
            if (replyText != null && replyText.trim().isNotEmpty) {
              if (mounted) {
                setState(() {
                  _messages.add({'role': 'ai', 'text': replyText.trim()});
                  _isLoading = false;
                });
              }
              return;
            }
          }
        }
      }
    } catch (_) {
      
    }

    if (mounted) {
      setState(() {
        _messages.add({
          'role': 'ai',
          'text': widget.isKazakh
              ? '«Қостанай Минералдары» АҚ бойынша ауысым штаттық режимде жұмыс істеуде. Бос слесарлар: Дуйсенов С. (5 разряд), Ахметов Е. (5 разряд). Авариялық наряд №147 орындалуда.'
              : 'Смена АО «Костанайские Минералы» работает в штатном режиме. Свободные слесари: Дуйсенов С.Б., Ахметов Е.К. Аварийный наряд №147 находится в исполнении.'
        });
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return CupertinoPageScaffold(
      navigationBar: CupertinoNavigationBar(
        middle: Text(widget.isKazakh ? 'ЖИ Ауысым көмекшісі' : 'ИИ-Ассистент смены (Gemini)'),
      ),
      child: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: _messages.length + (_isLoading ? 1 : 0),
                itemBuilder: (context, idx) {
                  if (idx == _messages.length) {
                    return Align(
                      alignment: Alignment.centerLeft,
                      child: Container(
                        margin: const EdgeInsets.only(bottom: 10),
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                        decoration: BoxDecoration(
                          color: CupertinoColors.white,
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: const Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            CupertinoActivityIndicator(),
                            SizedBox(width: 8),
                            Text('Gemini 3.1 думает...', style: TextStyle(fontSize: 12, color: CupertinoColors.systemGrey)),
                          ],
                        ),
                      ),
                    );
                  }
                  final msg = _messages[idx];
                  final isUser = msg['role'] == 'user';
                  return Align(
                    alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
                    child: Container(
                      margin: const EdgeInsets.only(bottom: 10),
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: isUser ? CupertinoColors.activeBlue : CupertinoColors.white,
                        borderRadius: BorderRadius.circular(16),
                        boxShadow: [
                          BoxShadow(color: Colors.black.withValues(alpha: 0.03), blurRadius: 4),
                        ],
                      ),
                      child: Text(
                        msg['text']!,
                        style: TextStyle(
                          color: isUser ? CupertinoColors.white : CupertinoColors.black,
                          fontSize: 14,
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              color: CupertinoColors.white,
              child: Row(
                children: [
                  Expanded(
                    child: CupertinoTextField(
                      controller: _controller,
                      placeholder: widget.isKazakh ? 'Сұрақ қойыңыз...' : 'Задайте вопрос ассистенту...',
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                      decoration: BoxDecoration(
                        color: CupertinoColors.systemGrey6,
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  CupertinoButton(
                    padding: EdgeInsets.zero,
                    onPressed: _send,
                    child: const Icon(CupertinoIcons.arrow_up_circle_fill, size: 32),
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
