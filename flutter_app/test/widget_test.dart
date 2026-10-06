import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_app/main.dart';

void main() {
  testWidgets('NaryadAiApp smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(const NaryadAiApp());
    expect(find.byType(NaryadAiApp), findsOneWidget);
  });
}
