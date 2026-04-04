import UIKit
import WebKit
import Capacitor

private var kToolbarKey: UInt8 = 0
private var swizzled = false

// App color palette (from tailwind.config.js) as dynamic UIColors
private let appBackground = UIColor { trait in
    trait.userInterfaceStyle == .dark
        ? UIColor(red: 0x22/255, green: 0x1F/255, blue: 0x22/255, alpha: 1) // gray-900 #221F22
        : UIColor(red: 0xFC/255, green: 0xFC/255, blue: 0xFA/255, alpha: 1) // gray-50  #FCFCFA
}
private let appButtonTint = UIColor { trait in
    trait.userInterfaceStyle == .dark
        ? UIColor(red: 0x72/255, green: 0x70/255, blue: 0x72/255, alpha: 1) // gray-500 #727072
        : UIColor(red: 0x93/255, green: 0x92/255, blue: 0x93/255, alpha: 1) // gray-400 #939293
}
private let appDisabledTint = UIColor { trait in
    trait.userInterfaceStyle == .dark
        ? UIColor(red: 0x40/255, green: 0x3E/255, blue: 0x41/255, alpha: 1) // gray-700 #403E41
        : UIColor(red: 0xC1/255, green: 0xC0/255, blue: 0xC0/255, alpha: 1) // gray-300 #C1C0C0
}
private let appDivider = UIColor { trait in
    trait.userInterfaceStyle == .dark
        ? UIColor(red: 0x40/255, green: 0x3E/255, blue: 0x41/255, alpha: 1) // gray-700 #403E41
        : UIColor(red: 0xC1/255, green: 0xC0/255, blue: 0xC0/255, alpha: 0.6) // gray-300/60
}

class MyViewController: CAPBridgeViewController {

    private var toolbarView: UIView!
    private var allButtons: [ToolbarButton] = []

    private struct ToolbarButton {
        let id: String
        let sfSymbol: String
        let title: String
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        buildToolbar()
        swizzleInputAccessoryView()
    }

    // MARK: - Build scrollable toolbar

    private func buildToolbar() {
        let undoRedo: [ToolbarButton] = [
            .init(id: "undo", sfSymbol: "arrow.uturn.backward", title: "Undo"),
            .init(id: "redo", sfSymbol: "arrow.uturn.forward", title: "Redo"),
        ]
        let formatting: [ToolbarButton] = [
            .init(id: "bold", sfSymbol: "bold", title: "Bold"),
            .init(id: "italic", sfSymbol: "italic", title: "Italic"),
            .init(id: "strikethrough", sfSymbol: "strikethrough", title: "Strikethrough"),
            .init(id: "heading", sfSymbol: "number", title: "Heading"),
            .init(id: "list", sfSymbol: "list.bullet", title: "List"),
            .init(id: "checklist", sfSymbol: "checklist", title: "Checklist"),
            .init(id: "quote", sfSymbol: "text.quote", title: "Quote"),
            .init(id: "code", sfSymbol: "chevron.left.forwardslash.chevron.right", title: "Code"),
            .init(id: "link", sfSymbol: "link", title: "Link"),
        ]
        allButtons = undoRedo + formatting

        let barHeight: CGFloat = 44
        let bottomMargin: CGFloat = 6
        let sideMargin: CGFloat = 6
        let cornerRadius: CGFloat = 12

        // Outer container — transparent, includes bottom margin
        let container = InputAccessoryContainerView(
            frame: CGRect(x: 0, y: 0, width: UIScreen.main.bounds.width, height: barHeight + bottomMargin),
            innerHeight: barHeight + bottomMargin
        )
        container.autoresizingMask = [.flexibleWidth]
        container.backgroundColor = .clear

        // Inner pill — rounded, holds all content
        let pill = UIView()
        pill.backgroundColor = appBackground
        pill.layer.cornerRadius = cornerRadius
        pill.layer.cornerCurve = .continuous
        pill.clipsToBounds = true
        pill.translatesAutoresizingMaskIntoConstraints = false
        container.addSubview(pill)
        NSLayoutConstraint.activate([
            pill.topAnchor.constraint(equalTo: container.topAnchor),
            pill.leadingAnchor.constraint(equalTo: container.leadingAnchor, constant: sideMargin),
            pill.trailingAnchor.constraint(equalTo: container.trailingAnchor, constant: -sideMargin),
            pill.bottomAnchor.constraint(equalTo: container.bottomAnchor, constant: -bottomMargin),
        ])

        // Scroll view for buttons
        let scrollView = UIScrollView()
        scrollView.showsHorizontalScrollIndicator = false
        scrollView.showsVerticalScrollIndicator = false
        scrollView.alwaysBounceHorizontal = true
        scrollView.translatesAutoresizingMaskIntoConstraints = false
        pill.addSubview(scrollView)

        // Dismiss button pinned to the right
        let dismissBtn = UIButton(type: .system)
        dismissBtn.setImage(UIImage(systemName: "keyboard.chevron.compact.down"), for: .normal)
        dismissBtn.tintColor = appButtonTint
        dismissBtn.addTarget(self, action: #selector(dismissKeyboard), for: .touchUpInside)
        dismissBtn.accessibilityLabel = "Dismiss keyboard"
        dismissBtn.translatesAutoresizingMaskIntoConstraints = false
        pill.addSubview(dismissBtn)

        NSLayoutConstraint.activate([
            dismissBtn.trailingAnchor.constraint(equalTo: pill.trailingAnchor, constant: -8),
            dismissBtn.centerYAnchor.constraint(equalTo: pill.centerYAnchor),
            dismissBtn.widthAnchor.constraint(equalToConstant: 36),
            dismissBtn.heightAnchor.constraint(equalToConstant: barHeight),

            scrollView.leadingAnchor.constraint(equalTo: pill.leadingAnchor),
            scrollView.topAnchor.constraint(equalTo: pill.topAnchor),
            scrollView.bottomAnchor.constraint(equalTo: pill.bottomAnchor),
            scrollView.trailingAnchor.constraint(equalTo: dismissBtn.leadingAnchor, constant: -4),
        ])

        // Stack view inside scroll view
        let stack = UIStackView()
        stack.axis = .horizontal
        stack.alignment = .center
        stack.spacing = 2
        stack.translatesAutoresizingMaskIntoConstraints = false
        scrollView.addSubview(stack)

        NSLayoutConstraint.activate([
            stack.leadingAnchor.constraint(equalTo: scrollView.contentLayoutGuide.leadingAnchor, constant: 8),
            stack.trailingAnchor.constraint(equalTo: scrollView.contentLayoutGuide.trailingAnchor, constant: -8),
            stack.topAnchor.constraint(equalTo: scrollView.contentLayoutGuide.topAnchor),
            stack.bottomAnchor.constraint(equalTo: scrollView.contentLayoutGuide.bottomAnchor),
            stack.heightAnchor.constraint(equalTo: scrollView.frameLayoutGuide.heightAnchor),
        ])

        // Add undo/redo buttons
        for (i, btn) in undoRedo.enumerated() {
            stack.addArrangedSubview(makeButton(btn, tag: i))
        }

        // Divider
        stack.addArrangedSubview(makeDivider())

        // Format buttons
        for (i, btn) in formatting.enumerated() {
            stack.addArrangedSubview(makeButton(btn, tag: undoRedo.count + i))
        }

        toolbarView = container
    }

    private func makeButton(_ btn: ToolbarButton, tag: Int) -> UIButton {
        let button = UIButton(type: .system)
        button.setImage(UIImage(systemName: btn.sfSymbol), for: .normal)
        button.tintColor = appButtonTint
        button.tag = tag
        button.accessibilityLabel = btn.title
        button.addTarget(self, action: #selector(toolbarButtonTapped(_:)), for: .touchUpInside)
        button.translatesAutoresizingMaskIntoConstraints = false
        NSLayoutConstraint.activate([
            button.widthAnchor.constraint(equalToConstant: 40),
            button.heightAnchor.constraint(equalToConstant: 40),
        ])
        return button
    }

    private func makeDivider() -> UIView {
        let container = UIView()
        container.translatesAutoresizingMaskIntoConstraints = false
        let line = UIView()
        line.backgroundColor = appDivider
        line.translatesAutoresizingMaskIntoConstraints = false
        container.addSubview(line)
        NSLayoutConstraint.activate([
            container.widthAnchor.constraint(equalToConstant: 9),
            container.heightAnchor.constraint(equalToConstant: 40),
            line.centerXAnchor.constraint(equalTo: container.centerXAnchor),
            line.centerYAnchor.constraint(equalTo: container.centerYAnchor),
            line.widthAnchor.constraint(equalToConstant: 1),
            line.heightAnchor.constraint(equalToConstant: 24),
        ])
        return container
    }

    // MARK: - Actions

    @objc private func toolbarButtonTapped(_ sender: UIButton) {
        guard sender.tag >= 0, sender.tag < allButtons.count else { return }
        let id = allButtons[sender.tag].id
        webView?.evaluateJavaScript(
            "window.dispatchEvent(new CustomEvent('nativeToolbarTap',{detail:'\(id)'}))"
        )
    }

    @objc private func dismissKeyboard() {
        webView?.endEditing(true)
    }

    // MARK: - Swizzle WKContentView.inputAccessoryView

    private func swizzleInputAccessoryView() {
        guard !swizzled else { return }
        guard let wkContentViewClass = NSClassFromString("WKContentView") else { return }

        let sel = NSSelectorFromString("inputAccessoryView")
        guard let original = class_getInstanceMethod(wkContentViewClass, sel) else { return }

        let block: @convention(block) (AnyObject) -> UIView? = { obj in
            var view = obj as? UIView
            while let v = view {
                if let wk = v as? WKWebView {
                    return objc_getAssociatedObject(wk, &kToolbarKey) as? UIView
                }
                view = v.superview
            }
            return nil
        }

        method_setImplementation(original, imp_implementationWithBlock(block))
        swizzled = true

        if let wv = self.webView {
            objc_setAssociatedObject(wv, &kToolbarKey, toolbarView, .OBJC_ASSOCIATION_RETAIN_NONATOMIC)
        }
    }
}

/// Subclass so the system sizes the inputAccessoryView correctly.
class InputAccessoryContainerView: UIView {
    private let innerHeight: CGFloat

    init(frame: CGRect, innerHeight: CGFloat) {
        self.innerHeight = innerHeight
        super.init(frame: frame)
    }

    required init?(coder: NSCoder) {
        self.innerHeight = 50
        super.init(coder: coder)
    }

    override var intrinsicContentSize: CGSize {
        return CGSize(width: UIView.noIntrinsicMetric, height: innerHeight)
    }
}
