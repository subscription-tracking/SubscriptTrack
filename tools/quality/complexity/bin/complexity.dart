// Dart kaynak dosyalarında metot başına döngüsel karmaşıklık, uzunluk ve iç içe
// derinlik ölçer.
//
// Kullanım: dart run bin/complexity.dart <lib_klasörü> <çıktı.json>
//
// Döngüsel karmaşıklık = 1 + karar noktaları (if, for, while, do, case, catch,
// ?:, &&, ||, ??, koleksiyon içi if/for). Metot gövdesindeki anonim
// fonksiyonlar (Flutter build closure'ları) çevreleyen metoda dahildir.
import 'dart:convert';
import 'dart:io';

import 'package:analyzer/dart/analysis/utilities.dart';
import 'package:analyzer/dart/ast/ast.dart';
import 'package:analyzer/dart/ast/token.dart';
import 'package:analyzer/dart/ast/visitor.dart';
import 'package:analyzer/source/line_info.dart';

class _Counter extends RecursiveAstVisitor<void> {
  int decisions = 0;
  int depth = 0;
  int maxDepth = 0;

  void _enter(void Function() visit) {
    depth++;
    if (depth > maxDepth) maxDepth = depth;
    visit();
    depth--;
  }

  @override
  void visitIfStatement(IfStatement node) {
    decisions++;
    _enter(() => super.visitIfStatement(node));
  }

  @override
  void visitIfElement(IfElement node) {
    decisions++;
    super.visitIfElement(node);
  }

  @override
  void visitForStatement(ForStatement node) {
    decisions++;
    _enter(() => super.visitForStatement(node));
  }

  @override
  void visitForElement(ForElement node) {
    decisions++;
    super.visitForElement(node);
  }

  @override
  void visitWhileStatement(WhileStatement node) {
    decisions++;
    _enter(() => super.visitWhileStatement(node));
  }

  @override
  void visitDoStatement(DoStatement node) {
    decisions++;
    _enter(() => super.visitDoStatement(node));
  }

  @override
  void visitSwitchStatement(SwitchStatement node) {
    _enter(() => super.visitSwitchStatement(node));
  }

  @override
  void visitSwitchCase(SwitchCase node) {
    decisions++;
    super.visitSwitchCase(node);
  }

  @override
  void visitSwitchPatternCase(SwitchPatternCase node) {
    decisions++;
    super.visitSwitchPatternCase(node);
  }

  @override
  void visitSwitchExpressionCase(SwitchExpressionCase node) {
    decisions++;
    super.visitSwitchExpressionCase(node);
  }

  @override
  void visitCatchClause(CatchClause node) {
    decisions++;
    _enter(() => super.visitCatchClause(node));
  }

  @override
  void visitConditionalExpression(ConditionalExpression node) {
    decisions++;
    super.visitConditionalExpression(node);
  }

  @override
  void visitBinaryExpression(BinaryExpression node) {
    final t = node.operator.type;
    if (t == TokenType.AMPERSAND_AMPERSAND ||
        t == TokenType.BAR_BAR ||
        t == TokenType.QUESTION_QUESTION) {
      decisions++;
    }
    super.visitBinaryExpression(node);
  }

  @override
  void visitFunctionExpression(FunctionExpression node) {
    _enter(() => super.visitFunctionExpression(node));
  }
}

class _Method {
  _Method(this.file, this.name, this.line, this.lines, this.cc, this.depth);

  final String file;
  final String name;
  final int line;
  final int lines;
  final int cc;
  final int depth;

  Map<String, Object> toJson() => {
        'file': file,
        'name': name,
        'line': line,
        'lines': lines,
        'cc': cc,
        'depth': depth,
      };
}

void main(List<String> args) {
  if (args.length < 2) {
    stderr.writeln('kullanım: complexity <lib_klasörü> <çıktı.json>');
    exit(64);
  }
  final root = Directory(args[0]);
  final methods = <_Method>[];
  var files = 0;

  for (final entity in root.listSync(recursive: true)) {
    if (entity is! File || !entity.path.endsWith('.dart')) continue;
    files++;
    final content = entity.readAsStringSync();
    final result = parseString(content: content, throwIfDiagnostics: false);
    final lineInfo = result.lineInfo;
    final rel = entity.path.replaceAll('\\', '/');

    void record(String name, AstNode node, FunctionBody? body) {
      if (body == null || body is EmptyFunctionBody) return;
      final counter = _Counter();
      body.accept(counter);
      final start = lineInfo.getLocation(node.offset).lineNumber;
      final end = lineInfo.getLocation(node.end).lineNumber;
      methods.add(_Method(
        rel,
        name,
        start,
        end - start + 1,
        1 + counter.decisions,
        counter.maxDepth,
      ));
    }

    result.unit.accept(_Collector(record));
  }

  final out = {
    'files': files,
    'methods': methods.map((m) => m.toJson()).toList(),
  };
  File(args[1]).writeAsStringSync(const JsonEncoder.withIndent(' ').convert(out));
  stdout.writeln('$files dosya, ${methods.length} metot');
}

class _Collector extends RecursiveAstVisitor<void> {
  _Collector(this.record);

  final void Function(String name, AstNode node, FunctionBody? body) record;
  final List<String> _scope = [];

  @override
  void visitClassDeclaration(ClassDeclaration node) {
    _scope.add(node.name.lexeme);
    super.visitClassDeclaration(node);
    _scope.removeLast();
  }

  @override
  void visitMixinDeclaration(MixinDeclaration node) {
    _scope.add(node.name.lexeme);
    super.visitMixinDeclaration(node);
    _scope.removeLast();
  }

  @override
  void visitExtensionDeclaration(ExtensionDeclaration node) {
    _scope.add(node.name?.lexeme ?? 'extension');
    super.visitExtensionDeclaration(node);
    _scope.removeLast();
  }

  @override
  void visitMethodDeclaration(MethodDeclaration node) {
    record('${_scope.join('.')}.${node.name.lexeme}', node, node.body);
    // Gövde içindeki iç fonksiyonlar ayrı metot sayılmaz.
  }

  @override
  void visitConstructorDeclaration(ConstructorDeclaration node) {
    final name = node.name?.lexeme ?? 'new';
    record('${_scope.join('.')}.$name', node, node.body);
  }

  @override
  void visitFunctionDeclaration(FunctionDeclaration node) {
    record(node.name.lexeme, node, node.functionExpression.body);
  }
}
