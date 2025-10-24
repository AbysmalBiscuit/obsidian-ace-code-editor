import { ChevronDown, ChevronUp } from "lucide-react";
import * as React from "react";
import "./Select.css";

export interface SelectOption {
	value: unknown;
	label: string;
}

interface SelectProps {
	value: unknown;
	onChange: (value: unknown) => void;
	options: SelectOption[];
	placeholder?: string;
	className?: string;
}

export const Select: React.FC<SelectProps> = ({
	value,
	onChange,
	options,
	placeholder = "Select an option",
	className = "",
}) => {
	const [isOpen, setIsOpen] = React.useState(false);
	const selectRef = React.useRef<HTMLDivElement>(null);
	const dropdownRef = React.useRef<HTMLDivElement>(null);
	const selectedOptionRef = React.useRef<HTMLDivElement>(null);
	const [maxDropdownWidth, setMaxDropdownWidth] = React.useState(0);

	const selectedOption = options.find((opt) => opt.value === value);
	const selectedIndex = options.findIndex((opt) => opt.value === value);

	// 虚拟滚动相关状态
	const [visibleStartIndex, setVisibleStartIndex] = React.useState(0);
	const itemHeight = 36; // 选项高度，需根据实际CSS调整
	const visibleItems = 10; // 一次渲染的可见项数量
	const bufferItems = 5; // 缓冲项数量，提高滚动体验

	// 计算虚拟列表显示内容
	const totalHeight = options.length * itemHeight;
	const visibleOptionsEndIndex = Math.min(
		visibleStartIndex + visibleItems + bufferItems,
		options.length,
	);
	const visibleOptions = options.slice(
		Math.max(0, visibleStartIndex - bufferItems),
		visibleOptionsEndIndex,
	);

	// 处理滚动事件
	const handleScroll = React.useCallback(
		(e: React.UIEvent<HTMLDivElement>) => {
			const scrollTop = e.currentTarget.scrollTop;
			const newStartIndex = Math.floor(scrollTop / itemHeight);
			setVisibleStartIndex(newStartIndex);
		},
		[itemHeight],
	);

	// 打开下拉框时滚动到选中项
	React.useEffect(() => {
		if (isOpen && dropdownRef.current && selectedIndex >= 0) {
			const scrollPosition = selectedIndex * itemHeight;
			dropdownRef.current.scrollTop = scrollPosition;
			setVisibleStartIndex(
				Math.max(0, selectedIndex - Math.floor(visibleItems / 2)),
			);
		}
	}, [isOpen, selectedIndex, itemHeight, visibleItems]);

	React.useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				selectRef.current &&
				!selectRef.current.contains(event.target as Node)
			) {
				setIsOpen(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () =>
			document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	// Calculate max width of dropdown options whenever options change.
	// This ensures the dropdown has sufficient width for the widest item when opened.
	React.useEffect(() => {
		if (options.length > 0) {
			let maxWidth = 0;
			const tempSpan = document.createElement("span");
			tempSpan.style.position = "absolute";
			tempSpan.style.visibility = "hidden";
			tempSpan.style.whiteSpace = "nowrap";

			// Clone styles from a representative element for accurate measurement.
			// Since .ace-select-option doesn't specify font, it inherits.
			// Using document.body's computed style as a baseline.
			tempSpan.style.fontFamily = getComputedStyle(
				document.body,
			).fontFamily;
			tempSpan.style.fontSize = getComputedStyle(document.body).fontSize;
			tempSpan.style.padding = "8px 12px"; // Match .ace-select-option padding

			document.body.appendChild(tempSpan);

			options.forEach((option) => {
				tempSpan.textContent = option.label;
				maxWidth = Math.max(maxWidth, tempSpan.offsetWidth + 20);
			});

			document.body.removeChild(tempSpan);

			// maxDropdownWidth now includes padding from tempSpan.
			// If the main select button has an arrow, its width will also be a factor
			// in the overall width when open. For simplicity, we'll set the wrapper width
			// directly to maxDropdownWidth to align with the dropdown.
			setMaxDropdownWidth(maxWidth);
		}
	}, [options]); // Dependencies: Recalculate when options change.

	return (
		<div className="ace-select-wrapper" ref={selectRef}>
			<div
				className={`ace-select ${
					isOpen ? "ace-select-open" : ""
				} ${className}`}
				onClick={() => setIsOpen(!isOpen)}
				style={{
					width:
						isOpen && maxDropdownWidth > 0
							? `${maxDropdownWidth}px`
							: "auto",
				}}
			>
				<span className="ace-select-value">
					{selectedOption ? selectedOption.label : placeholder}
				</span>
				<span className="ace-select-arrow">
					{isOpen ? <ChevronUp /> : <ChevronDown />}
				</span>
			</div>
			{isOpen && (
				<div
					ref={dropdownRef}
					className="ace-select-dropdown"
					onScroll={handleScroll}
					style={{
						// The dropdown itself should always be as wide as the widest option calculated.
						width:
							maxDropdownWidth > 0
								? `${maxDropdownWidth}px`
								: "auto",
					}}
				>
					<div
						className="ace-select-options-container"
						style={{
							height: `${totalHeight}px`,
							position: "relative",
						}}
					>
						{visibleOptions.map((option, index) => {
							const actualIndex =
								Math.max(0, visibleStartIndex - bufferItems) +
								index;
							const isSelected = option.value === value;

							return (
								<div
									key={String(option.value)}
									ref={
										isSelected
											? selectedOptionRef
											: undefined
									}
									className={`ace-select-option ${
										isSelected ? "selected" : ""
									}`}
									style={{
										position: "absolute",
										top: `${actualIndex * itemHeight}px`,
										// Options within the dropdown should take 100% of the dropdown's width.
										width: "100%",
										height: `${itemHeight}px`,
									}}
									onClick={() => {
										onChange(option.value);
										setIsOpen(false);
									}}
								>
									{option.label}
								</div>
							);
						})}
					</div>
				</div>
			)}
		</div>
	);
};
