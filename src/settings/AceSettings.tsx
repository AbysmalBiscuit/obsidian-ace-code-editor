import { IconPicker } from "@/src/component/icon-picker/IconPicker";
import { Input } from "@/src/component/input/Input";
import { Select } from "@/src/component/select/Select";
import { TabNav, TabNavItem } from "@/src/component/tab-nav/TabNav";
import { TagInput } from "@/src/component/tag-input/TagInput";
import { Toggle } from "@/src/component/toggle/Toggle";
import { t } from "@/src/i18n/i18n";
import AceCodeEditorPlugin from "@/src/main";
import { languageModeMap } from "@/src/service/AceLanguages";
import {
	AceDarkThemesList,
	AceKeyboardList,
	AceLightThemesList,
} from "@/src/service/AceThemes";
import { ICodeEditorConfig } from "@/src/type/types";
import parse from "html-react-parser";
import { Notice, Platform } from "obsidian";
import * as React from "react";
import { SettingsItem } from "./item/SettingItem";

interface FontData {
	family: string;
	fullName: string;
	postscriptName: string;
	style: string;
	blob(): Promise<Blob>;
}

declare global {
	interface Window {
		queryLocalFonts: () => Promise<FontData[]>;
	}
}

interface AceSettingsProps {
	plugin: AceCodeEditorPlugin;
}

export const AceSettings: React.FC<AceSettingsProps> = ({ plugin }) => {
	const [settingsValue, setSettingsValue] = React.useState(plugin.settings);

	// 监听外部settings变化，同步到本地状态
	React.useEffect(() => {
		setSettingsValue(plugin.settings);
	}, [plugin.settings]);

	const [systemFonts, setSystemFonts] = React.useState<string[]>([]);

	// 加载系统字体
	React.useEffect(() => {
		async function loadSystemFonts() {
			try {
				const uniqueFonts = new Set<string>();

				// 1. 尝试使用 Local Font Access API 获取本地字体
				if (Platform.isDesktopApp && "queryLocalFonts" in window) {
					try {
						const localFonts = await window.queryLocalFonts();
						localFonts.forEach((font) => {
							if (font.family) {
								uniqueFonts.add(font.family);
							}
						});
					} catch (error) {
						console.warn(
							"Local Font Access API failed, falling back:",
							error,
						);
					}
				}

				// 2. 添加 all predefined fallback fonts without availability check, all as suggestions
				let fallbackFonts: string[] = [];
				if (Platform.isDesktopApp) {
					fallbackFonts = getDesktopFallbackFonts();
				} else if (Platform.isMobileApp) {
					fallbackFonts = getMobileFallbackFonts();
				} else {
					fallbackFonts = getWebFallbackFonts();
				}
				fallbackFonts
					.concat(getBasicFallbackFonts())
					.forEach((font) => {
						uniqueFonts.add(font);
					});

				// 3. 将当前设置中已有的字体也加入建议列表，确保用户输入的自定义字体也能被再次建议
				settingsValue.fontFamily.forEach((font) =>
					uniqueFonts.add(font),
				);

				const sortedFonts = Array.from(uniqueFonts).sort((a, b) =>
					a.localeCompare(b),
				);
				setSystemFonts(sortedFonts);
			} catch (error) {
				new Notice("Failed to load system fonts, using basic list.");
				console.error("Error loading system fonts:", error);
				setSystemFonts(["monospace", "sans-serif"]);
			}
		}

		loadSystemFonts();
	}, []);

	// 获取桌面端常见字体（Windows/macOS/Linux）
	function getDesktopFallbackFonts(): string[] {
		return [
			// 编程字体
			"Fira Code",
			"Source Code Pro",
			"JetBrains Mono",
			"Cascadia Code",
			"Monaco",
			"Menlo",
			"Consolas",
			"Courier New",
			// Windows 字体
			"Microsoft YaHei",
			"SimSun",
			"SimHei",
			"Arial",
			"Times New Roman",
			"Calibri",
			"Segoe UI",
			// macOS 字体
			"PingFang SC",
			"Helvetica Neue",
			"San Francisco",
			"Hiragino Sans GB",
			// Linux 字体
			"Noto Sans CJK SC",
			"WenQuanYi Micro Hei",
			"Ubuntu",
			"DejaVu Sans",
		];
	}

	// 获取移动端常见字体
	function getMobileFallbackFonts(): string[] {
		return [
			"system-ui",
			"-apple-system",
			"BlinkMacSystemFont",
			"Roboto",
			"Helvetica Neue",
			"Arial",
			"Noto Sans",
			"sans-serif",
			"monospace",
		];
	}

	// 获取Web端通用字体
	function getWebFallbackFonts(): string[] {
		return [
			"system-ui",
			"-apple-system",
			"BlinkMacSystemFont",
			"Segoe UI",
			"Roboto",
			"Helvetica Neue",
			"Arial",
			"Noto Sans",
			"sans-serif",
			"Consolas",
			"Monaco",
			"monospace",
		];
	}

	// 获取基础降级字体
	function getBasicFallbackFonts(): string[] {
		return ["monospace", "sans-serif", "serif", "Arial", "Courier New"];
	}

	const handleUpdateConfig = React.useCallback(
		async (newSettings: Partial<ICodeEditorConfig>) => {
			const updatedSettings = { ...settingsValue, ...newSettings };
			setSettingsValue(updatedSettings);
			// 直接调用plugin.updateSettings，避免useEffect带来的副作用
			await plugin.updateSettings(newSettings);
		},
		[settingsValue, plugin],
	);

	const lightThemeOptions = React.useMemo(
		() =>
			AceLightThemesList.map((theme) => ({
				value: theme,
				label: theme,
			})),
		[],
	);

	const darkThemeOptions = React.useMemo(
		() =>
			AceDarkThemesList.map((theme) => ({
				value: theme,
				label: theme,
			})),
		[],
	);

	const keyboardOptions = React.useMemo(
		() =>
			AceKeyboardList.map((keyboard) => ({
				value: keyboard,
				label: keyboard,
			})),
		[],
	);

	const softWrapOptions = React.useMemo(
		() => [
			{ value: "off", label: "Off" },
			{ value: "free", label: "Free" },
			{ value: "printmargin", label: "Print Margin" },
			{ value: "true", label: "Wrap Enabled" },
			{ value: "false", label: "Wrap Disabled" },
		],
		[],
	);

	const EditorSettings = React.useMemo(() => {
		return <></>;
	}, []);

	const RendererSettings = React.useMemo(() => {
		return (
			<>
				<SettingsItem
					name={t("setting.lightTheme.name")}
					desc={t("setting.lightTheme.desc")}
				>
					<Select
						options={lightThemeOptions}
						value={settingsValue.lightTheme}
						onChange={(value) =>
							handleUpdateConfig({ lightTheme: value as string })
						}
					/>
				</SettingsItem>

				<SettingsItem
					name={t("setting.darkTheme.name")}
					desc={t("setting.darkTheme.desc")}
				>
					<Select
						options={darkThemeOptions}
						value={settingsValue.darkTheme}
						onChange={(value) =>
							handleUpdateConfig({ darkTheme: value as string })
						}
					/>
				</SettingsItem>

				<SettingsItem
					name={t("setting.fontFamily.name")}
					desc={t("setting.fontFamily.desc")}
					collapsible={true}
					defaultCollapsed={false}
				>
					<TagInput
						values={settingsValue.fontFamily}
						onChange={(value) =>
							handleUpdateConfig({ fontFamily: value })
						}
						suggestions={systemFonts}
						placeholder={t("setting.fontFamily.placeholder")}
						renderCustomSuggestion={(font) => (
							<div
								className="ace-font-family"
								style={{
									fontFamily: font,
								}}
							>
								<span>{font}</span>
							</div>
						)}
					/>
				</SettingsItem>

				<SettingsItem
					name={t("setting.fontSize.name")}
					desc={t("setting.fontSize.desc")}
				>
					<Input
						type="number"
						value={settingsValue.fontSize}
						onChange={(value) =>
							handleUpdateConfig({ fontSize: Number(value) })
						}
					/>
				</SettingsItem>

				<SettingsItem
					name={t("setting.showLineNumbers.name")}
					desc={t("setting.showLineNumbers.desc")}
				>
					<Toggle
						checked={settingsValue.showLineNumbers}
						onChange={(value) =>
							handleUpdateConfig({ showLineNumbers: value })
						}
					/>
				</SettingsItem>

				<SettingsItem
					name={t("setting.showPrintMargin.name")}
					desc={t("setting.showPrintMargin.desc")}
				>
					<Toggle
						checked={settingsValue.showPrintMargin}
						onChange={(value) =>
							handleUpdateConfig({ showPrintMargin: value })
						}
					/>
				</SettingsItem>

				<SettingsItem
					name={t("setting.showInvisibles.name")}
					desc={t("setting.showInvisibles.desc")}
				>
					<Toggle
						checked={settingsValue.showInvisibles}
						onChange={(value) =>
							handleUpdateConfig({ showInvisibles: value })
						}
					/>
				</SettingsItem>

				<SettingsItem
					name={t("setting.displayIndentGuides.name")}
					desc={t("setting.displayIndentGuides.desc")}
				>
					<Toggle
						checked={settingsValue.displayIndentGuides}
						onChange={(value) =>
							handleUpdateConfig({ displayIndentGuides: value })
						}
					/>
				</SettingsItem>

				<SettingsItem
					name={t("setting.showFoldWidgets.name")}
					desc={t("setting.showFoldWidgets.desc")}
				>
					<Toggle
						checked={settingsValue.showFoldWidgets}
						onChange={(value) =>
							handleUpdateConfig({ showFoldWidgets: value })
						}
					/>
				</SettingsItem>

				<SettingsItem
					name={t("setting.softWrap.name")}
					desc={t("setting.softWrap.desc")}
				>
					<Select
						options={softWrapOptions}
						value={
							typeof settingsValue.softWrap === "boolean"
								? String(settingsValue.softWrap)
								: typeof settingsValue.softWrap === "number"
									? "printmargin" // Default to 'printmargin' if softWrap is a number for display in Select
									: settingsValue.softWrap
						}
						onChange={(selectedValue) => {
							let newValue: ICodeEditorConfig["softWrap"];
							if (selectedValue === "true") {
								newValue = true;
							} else if (selectedValue === "false") {
								newValue = false;
							} else {
								newValue = selectedValue as
									| "off"
									| "free"
									| "printmargin";
							}
							handleUpdateConfig({ softWrap: newValue });
						}}
					/>
				</SettingsItem>
			</>
		);
	}, [settingsValue, systemFonts, handleUpdateConfig, softWrapOptions]);

	const SessionSettings = React.useMemo(() => {
		return (
			<>
				<SettingsItem
					name={t("setting.supportExtensions.name")}
					desc={t("setting.supportExtensions.desc")}
					collapsible={true}
					defaultCollapsed={false}
				>
					<TagInput
						values={settingsValue.supportExtensions}
						onChange={(value) =>
							handleUpdateConfig({ supportExtensions: value })
						}
						placeholder={t("setting.supportExtensions.placeholder")}
						suggestions={Object.values(languageModeMap).flat()}
					/>
				</SettingsItem>

				<SettingsItem
					name={t("setting.keyboard.name")}
					desc={t("setting.keyboard.desc")}
				>
					<Select
						options={keyboardOptions}
						value={settingsValue.keyboard}
						onChange={(value) =>
							handleUpdateConfig({ keyboard: value as string })
						}
					/>
				</SettingsItem>

				<SettingsItem
					name={t("setting.tabSize.name")}
					desc={t("setting.tabSize.desc")}
				>
					<Input
						type="number"
						value={settingsValue.tabSize}
						onChange={(value) =>
							handleUpdateConfig({ tabSize: Number(value) })
						}
					/>
				</SettingsItem>
			</>
		);
	}, [settingsValue, handleUpdateConfig]);

	const ExtendSettings = React.useMemo(() => {
		return (
			<>
				<SettingsItem
					name={t("setting.snippetsManager.name")}
					desc={t("setting.snippetsManager.desc")}
				>
					<Toggle
						checked={settingsValue.snippetsManager.location}
						onChange={(value) =>
							handleUpdateConfig({
								snippetsManager: {
									...settingsValue.snippetsManager,
									location: value,
								},
							})
						}
					/>
					<IconPicker
						app={plugin.app}
						value={settingsValue.snippetsManager.icon}
						onChange={(value) =>
							handleUpdateConfig({
								snippetsManager: {
									...settingsValue.snippetsManager,
									icon: value,
								},
							})
						}
					/>
				</SettingsItem>

				<SettingsItem
					name={t("setting.embedMaxHeight.name")}
					desc={t("setting.embedMaxHeight.desc")}
				>
					<Input
						type="number"
						value={settingsValue.embedMaxHeight}
						onChange={(value) =>
							handleUpdateConfig({
								embedMaxHeight: Number(value),
							})
						}
					/>
				</SettingsItem>
			</>
		);
	}, [settingsValue, handleUpdateConfig, plugin.app]);

	const AboutSettings = React.useMemo(() => {
		return (
			<>
				<SettingsItem
					name={"wiki"}
					desc={parse(t("setting.desc"))}
				></SettingsItem>
			</>
		);
	}, []);

	const settingsTabNavItems: TabNavItem[] = React.useMemo(
		() => [
			{
				id: "renderer",
				title: t("setting.tabs.renderer"),
				content: RendererSettings,
			},
			{
				id: "session",
				title: t("setting.tabs.session"),
				content: SessionSettings,
			},
			{
				id: "editor",
				title: t("setting.tabs.editor"),
				content: EditorSettings,
				disabled: true,
			},
			{
				id: "extend",
				title: t("setting.tabs.extend"),
				content: ExtendSettings,
			},
			{
				id: "about",
				title: t("setting.tabs.about"),
				content: AboutSettings,
			},
		],
		[
			RendererSettings,
			SessionSettings,
			EditorSettings,
			ExtendSettings,
			AboutSettings,
		],
	);

	return (
		<TabNav
			tabs={settingsTabNavItems}
			defaultValue="renderer"
			className="ace-settings-container"
		/>
	);
};
