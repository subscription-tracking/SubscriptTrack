class AppUser {
  const AppUser({
    required this.id,
    required this.email,
    this.displayName,
    required this.createdAt,
  });

  final String id;
  final String email;
  final String? displayName;
  final DateTime createdAt;

  Map<String, dynamic> toJson() => {
        'id': id,
        'email': email,
        'displayName': displayName,
        'createdAt': createdAt.toIso8601String(),
      };

  factory AppUser.fromJson(Map<String, dynamic> json) => AppUser(
        id: json['id'] as String,
        email: json['email'] as String,
        displayName: json['displayName'] as String?,
        createdAt: DateTime.parse(json['createdAt'] as String),
      );
}
