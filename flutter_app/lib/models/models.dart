class FaultCodeModel {
  final String code;
  final String category;
  final String description;
  final double normHours;

  FaultCodeModel({
    required this.code,
    required this.category,
    required this.description,
    required this.normHours,
  });
}

class MaterialModel {
  final String id;
  final String name;
  final String unit;
  int quantity;

  MaterialModel({
    required this.id,
    required this.name,
    required this.unit,
    this.quantity = 1,
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
  List<MaterialModel> materialsSpent;
  String? performedWork;
  String? workerComment;
  int aiScore;
  String? aiVerdict;
  String? aiNotes;
  bool isOverdue;

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
    this.photoBeforeUrl,
    this.photoAfterUrl,
    this.faultCode,
    List<MaterialModel>? materialsSpent,
    this.performedWork,
    this.workerComment,
    this.aiScore = 95,
    this.aiVerdict,
    this.aiNotes,
    this.isOverdue = false,
  }) : materialsSpent = materialsSpent ?? [];
}
